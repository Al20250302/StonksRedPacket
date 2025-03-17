import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import { WalletManager } from '../services/walletManager.service';
import dotenv from 'dotenv';

dotenv.config();

async function simpleTransfer() {
  try {
    console.log('执行简单转账测试...');
    
    // 初始化
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
    const walletManager = new WalletManager();
    
    // 获取管理员钱包
    const walletPath = walletManager.getAdminWalletPath();
    const secretKeyString = fs.readFileSync(walletPath, 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const adminKeypair = web3.Keypair.fromSecretKey(secretKey);
    
    // 获取代币铸造地址
    const mintAddressString = walletManager.getMintAddress();
    const mintAddress = new web3.PublicKey(mintAddressString);
    
    // 接收者地址
    const recipientAddress = new web3.PublicKey('Fi2TTcki6gaUHapMKqoGd3Qx1bzPygTiDsfHRhxkJwtq');
    
    // 获取管理员代币账户
    const adminTokenAccount = await token.getAssociatedTokenAddress(
      mintAddress,
      adminKeypair.publicKey
    );
    
    // 获取接收者代币账户
    const recipientTokenAccount = await token.getAssociatedTokenAddress(
      mintAddress,
      recipientAddress
    );
    
    console.log(`管理员代币账户: ${adminTokenAccount.toString()}`);
    console.log(`接收者代币账户: ${recipientTokenAccount.toString()}`);
    
    // 检查接收者账户是否存在
    const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
    
    if (!recipientAccountInfo) {
      console.log('接收者代币账户不存在，尝试创建...');
      
      // 创建接收者代币账户
      const createTx = new web3.Transaction().add(
        token.createAssociatedTokenAccountInstruction(
          adminKeypair.publicKey,
          recipientTokenAccount,
          recipientAddress,
          mintAddress
        )
      );
      
      const createSignature = await web3.sendAndConfirmTransaction(
        connection,
        createTx,
        [adminKeypair]
      );
      
      console.log(`创建接收者代币账户成功: ${createSignature}`);
    } else {
      console.log('接收者代币账户已存在');
    }
    
    // 转账金额
    const amount = 0.001 * 10**9; // 0.001代币，精度为9
    
    // 创建转账交易
    const transferTx = new web3.Transaction().add(
      token.createTransferInstruction(
        adminTokenAccount,
        recipientTokenAccount,
        adminKeypair.publicKey,
        amount
      )
    );
    
    // 发送交易
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transferTx,
      [adminKeypair]
    );
    
    console.log(`转账成功，交易签名: ${signature}`);
    
    // 查询转账后余额
    const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
    if (accountInfo) {
      const accountData = token.AccountLayout.decode(accountInfo.data);
      const balance = Number(accountData.amount) / (10 ** 9);
      console.log(`接收者当前余额: ${balance}`);
    }
    
  } catch (error) {
    console.error('简单转账测试失败:', error);
  }
}

simpleTransfer(); 