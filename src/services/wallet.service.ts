import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import { WalletManager } from './walletManager.service';

export class WalletService {
  private connection: web3.Connection;
  private walletManager: WalletManager;
  
  constructor() {
    // 选项1：使用更可靠的公共节点
    // this.connection = new web3.Connection('https://api.mainnet-beta.solana.com');
    
    // 选项2：使用特定的节点提供商（如果您有）
    // this.connection = new web3.Connection('https://solana-api.projectserum.com');
    
    // 选项3：使用devnet但增加超时和重试
    this.connection = new web3.Connection(
      web3.clusterApiUrl('mainnet-beta'),
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000, // 60秒超时
      }
    );
    
    this.walletManager = new WalletManager();
  }
  
  // 获取管理员钱包Keypair
  private async getAdminKeypair(): Promise<web3.Keypair> {
    const walletPath = this.walletManager.getAdminWalletPath();
    console.log(`读取钱包文件: ${walletPath}`);
    
    try {
      const secretKeyString = fs.readFileSync(walletPath, 'utf8');
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      return web3.Keypair.fromSecretKey(secretKey);
    } catch (error) {
      console.error(`读取钱包文件失败: ${error}`);
      throw new Error(`无法读取钱包文件: ${error}`);
    }
  }
  
  // 获取代币铸造地址
  private getMintAddress(): web3.PublicKey {
    const mintAddressString = this.walletManager.getMintAddress();
    console.log(`代币铸造地址字符串: ${mintAddressString}`);
    
    try {
      return new web3.PublicKey(mintAddressString);
    } catch (error) {
      console.error(`无效的代币铸造地址: ${mintAddressString}`);
      throw new Error(`无效的代币铸造地址: ${error}`);
    }
  }

  // 获取代币余额
  async getTokenBalance(walletAddress: string): Promise<number> {
    console.log(`尝试获取钱包余额: ${walletAddress}`);
    
    try {
      const userPublicKey = new web3.PublicKey(walletAddress);
      const mintAddress = this.getMintAddress();
      
      console.log(`查询钱包 ${userPublicKey.toString()} 的代币 ${mintAddress.toString()} 余额`);
      
      // 方法1：使用标准SPL代币方法
      try {
        // 尝试获取关联代币账户
        const tokenAccount = await token.getAssociatedTokenAddress(
          mintAddress,
          userPublicKey
        );
        
        console.log(`检查代币账户: ${tokenAccount.toString()}`);
        
        // 获取账户信息
        const accountInfo = await this.connection.getAccountInfo(tokenAccount);
        
        // 如果账户不存在
        if (!accountInfo) {
          console.log(`代币账户不存在，返回零余额`);
          return 0;
        }
        
        // 解析账户数据
        const accountData = token.AccountLayout.decode(accountInfo.data);
        const amount = Number(accountData.amount) / (10 ** 9); // 假设精度为9位
        
        console.log(`直接从代币账户获取的余额: ${amount}`);
        return amount;
      } catch (tokenError) {
        console.log(`尝试使用标准SPL方法失败: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`);
        console.log(`尝试使用getParsedTokenAccountsByOwner方法...`);
        
        // 方法2：使用getParsedTokenAccountsByOwner（如果方法1失败）
        const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
          userPublicKey,
          { mint: mintAddress }
        );
        
        if (tokenAccounts.value.length === 0) {
          console.log(`钱包 ${walletAddress} 没有持有代币 ${mintAddress.toString()}`);
          return 0;
        }
        
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        console.log(`通过getParsedTokenAccountsByOwner获取的余额: ${balance}`);
        return balance;
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Invalid public key input')) {
        console.error(`无效的公钥格式: ${walletAddress}`);
        throw new Error(`无效的钱包地址格式: ${walletAddress}`);
      }
      console.error(`获取代币余额失败: ${error instanceof Error ? error.message : String(error)}`);
      
      // 尝试直接使用命令行工具的替代方案
      console.log(`请尝试使用命令行工具检查余额: spl-token accounts --owner ${walletAddress}`);
      
      // 返回0而不是抛出错误，以允许应用程序继续运行
      console.log(`由于错误，返回零余额`);
      return 0;
    }
  }

  // 发送代币
  async sendTokens(recipientAddress: string, amount: number): Promise<string> {
    try {
      console.log(`尝试向 ${recipientAddress} 发送 ${amount} 个代币`);
      
      let recipient;
      try {
        recipient = new web3.PublicKey(recipientAddress);
      } catch (error) {
        console.error(`无效的接收者钱包地址: ${recipientAddress}`);
        throw new Error(`无效的接收者钱包地址: ${error}`);
      }
      
      const mintAddress = this.getMintAddress();
      const adminKeypair = await this.getAdminKeypair();
      
      // 检查管理员的SOL余额
      const adminSolBalance = await this.connection.getBalance(adminKeypair.publicKey);
      console.log(`管理员SOL余额: ${adminSolBalance / web3.LAMPORTS_PER_SOL} SOL`);
      
      if (adminSolBalance < web3.LAMPORTS_PER_SOL * 0.01) {
        throw new Error(`管理员SOL余额不足，无法支付交易费用。请确保至少有0.01 SOL`);
      }
      
      // 查找管理员的代币账户
      const adminTokenAccount = await token.getAssociatedTokenAddress(
        mintAddress,
        adminKeypair.publicKey
      );
      
      // 检查管理员的代币余额
      console.log(`检查管理员代币账户: ${adminTokenAccount.toString()}`);
      const adminTokenInfo = await this.connection.getAccountInfo(adminTokenAccount);
      
      if (!adminTokenInfo) {
        throw new Error(`管理员没有持有代币 ${mintAddress.toString()}。请先获取一些代币。`);
      }
      
      const adminTokenData = token.AccountLayout.decode(adminTokenInfo.data);
      const adminTokenBalance = Number(adminTokenData.amount) / (10 ** 9);
      console.log(`管理员代币余额: ${adminTokenBalance}`);
      
      if (adminTokenBalance < amount) {
        throw new Error(`管理员代币余额不足。当前余额: ${adminTokenBalance}，需要: ${amount}`);
      }
      
      // 查找或创建接收者的代币账户
      let recipientTokenAccount: web3.PublicKey;
      
      try {
        // 获取关联代币账户地址
        recipientTokenAccount = await token.getAssociatedTokenAddress(
          mintAddress,
          recipient
        );
        
        // 检查账户是否存在
        const accountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
        
        if (accountInfo) {
          console.log(`接收者代币账户已存在: ${recipientTokenAccount.toString()}`);
          // 不再尝试关闭和重新创建账户
        } else {
          // 只有当账户不存在时才创建
          console.log(`接收者代币账户不存在，尝试创建...`);
          const createTx = new web3.Transaction().add(
            token.createAssociatedTokenAccountInstruction(
              adminKeypair.publicKey,
              recipientTokenAccount,
              recipient,
              mintAddress
            )
          );
          
          try {
            const createSignature = await web3.sendAndConfirmTransaction(
              this.connection, 
              createTx, 
              [adminKeypair]
            );
            console.log(`创建接收者代币账户成功，交易签名: ${createSignature}`);
          } catch (createError: unknown) {
            // 如果创建失败，可能是账户已存在
            console.log(`创建账户失败: ${String(createError)}`);
            
            // 检查是否是"账户已存在"错误
            if ((createError as Error).toString().includes('already in use')) {
              console.log('账户已存在，尝试直接转账');
            } else {
              throw createError; // 其他错误则抛出
            }
          }
        }
      } catch (error) {
        console.error(`处理接收者代币账户时出错: ${error}`);
        throw error;
      }
      
      console.log(`管理员代币账户: ${adminTokenAccount.toString()}`);
      console.log(`准备转账 ${amount} 个代币...`);
      
      // 创建转账交易
      const transferTx = new web3.Transaction().add(
        token.createTransferInstruction(
          adminTokenAccount,
          recipientTokenAccount,
          adminKeypair.publicKey,
          amount * 10**9  // 假设代币精度为9位小数
        )
      );
      
      // 发送交易
      const signature = await web3.sendAndConfirmTransaction(
        this.connection,
        transferTx,
        [adminKeypair]
      );
      
      console.log(`转账成功，交易签名: ${signature}`);
      return signature;
    } catch (error) {
      console.error('发送代币失败:', error);
      throw error;
    }
  }
} 