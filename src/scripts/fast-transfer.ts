import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import { WalletManager } from '../services/walletManager.service';
import dotenv from 'dotenv';

dotenv.config();

async function fastTransfer() {
  try {
    console.log('执行快速转账测试...');
    
    // 初始化 - 使用更快的RPC节点
    const connection = new web3.Connection(
      web3.clusterApiUrl('mainnet-beta'),
      {
        commitment: 'confirmed' as web3.Commitment,
        confirmTransactionInitialTimeout: 30000, // 减少超时时间
      }
    );
    
    const walletManager = new WalletManager();
    
    // 获取管理员钱包 - 直接使用同步方法
    const walletPath = walletManager.getAdminWalletPath();
    const secretKeyString = fs.readFileSync(walletPath, 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const adminKeypair = web3.Keypair.fromSecretKey(secretKey);
    
    // 获取代币铸造地址
    const mintAddressString = walletManager.getMintAddress();
    const mintAddress = new web3.PublicKey(mintAddressString);
    
    // 新的接收者地址
    const recipientAddress = new web3.PublicKey('2iwLxeoaHRir1yMaApa4GC98eJkNdDDAToKkwsVYQzQR');
    
    // 并行获取账户信息
    const [adminTokenAccount, recipientTokenAccount] = await Promise.all([
      token.getAssociatedTokenAddress(mintAddress, adminKeypair.publicKey),
      token.getAssociatedTokenAddress(mintAddress, recipientAddress)
    ]);
    
    console.log(`管理员代币账户: ${adminTokenAccount.toString()}`);
    console.log(`接收者代币账户: ${recipientTokenAccount.toString()}`);
    
    // 并行获取账户信息和SOL余额
    const [recipientAccountInfo, adminTokenInfo, adminSolBalance] = await Promise.all([
      connection.getAccountInfo(recipientTokenAccount),
      connection.getAccountInfo(adminTokenAccount),
      connection.getBalance(adminKeypair.publicKey)
    ]);
    
    console.log(`管理员SOL余额: ${adminSolBalance / web3.LAMPORTS_PER_SOL} SOL`);
    
    // 检查管理员代币余额
    if (!adminTokenInfo) {
      throw new Error('管理员代币账户不存在');
    }
    
    const adminTokenData = token.AccountLayout.decode(adminTokenInfo.data);
    const adminTokenBalance = Number(adminTokenData.amount) / (10 ** 9);
    console.log(`管理员代币余额: ${adminTokenBalance}`);
    
    // 转账金额
    const amount = 0.01;
    const amountLamports = amount * 10**9; // 0.01代币，精度为9
    
    // 检查接收者账户是否存在
    let createSignature = '';
    if (!recipientAccountInfo) {
      console.log('接收者代币账户不存在，创建中...');
      
      // 创建接收者代币账户
      const createTx = new web3.Transaction().add(
        token.createAssociatedTokenAccountInstruction(
          adminKeypair.publicKey,
          recipientTokenAccount,
          recipientAddress,
          mintAddress
        )
      );
      
      const createOptions: web3.ConfirmOptions = {
        skipPreflight: false,
        preflightCommitment: 'confirmed' as web3.Commitment
      };
      
      createSignature = await web3.sendAndConfirmTransaction(
        connection,
        createTx,
        [adminKeypair],
        createOptions
      );
      
      console.log(`创建接收者代币账户成功: ${createSignature}`);
    } else {
      console.log('接收者代币账户已存在');
    }
    
    // 创建转账交易 - 使用更高的优先级
    const transferTx = new web3.Transaction().add(
      token.createTransferInstruction(
        adminTokenAccount,
        recipientTokenAccount,
        adminKeypair.publicKey,
        amountLamports
      )
    );
    
    // 设置交易选项以加快速度
    const transferOptions: web3.ConfirmOptions = {
      skipPreflight: false,
      preflightCommitment: 'confirmed' as web3.Commitment,
      maxRetries: 3
    };
    
    console.log(`准备转账 ${amount} 个代币...`);
    const startTime = Date.now();
    
    // 发送交易
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transferTx,
      [adminKeypair],
      transferOptions
    );
    
    const endTime = Date.now();
    console.log(`转账成功，耗时: ${endTime - startTime}ms`);
    console.log(`交易签名: ${signature}`);
    
    // 查询转账后余额 - 使用短暂延迟确保交易已确认
    console.log('等待交易确认...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
    if (accountInfo) {
      const accountData = token.AccountLayout.decode(accountInfo.data);
      const balance = Number(accountData.amount) / (10 ** 9);
      console.log(`接收者当前余额: ${balance}`);
    }
    
    console.log('快速转账测试完成');
  } catch (error) {
    console.error('快速转账测试失败:', error);
  }
}

fastTransfer(); 