import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import { WalletManager } from '../services/walletManager.service';
import dotenv from 'dotenv';

dotenv.config();

async function concurrentTransfer() {
  try {
    console.log('执行并发转账测试...');
    
    // 初始化连接
    const connection = new web3.Connection(
      web3.clusterApiUrl('mainnet-beta'),
      {
        commitment: 'confirmed' as web3.Commitment,
        confirmTransactionInitialTimeout: 60000,
      }
    );
    
    const walletManager = new WalletManager();
    
    // 获取管理员钱包
    const walletPath = walletManager.getAdminWalletPath();
    const secretKeyString = fs.readFileSync(walletPath, 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const adminKeypair = web3.Keypair.fromSecretKey(secretKey);
    
    // 获取代币铸造地址
    const mintAddressString = walletManager.getMintAddress();
    const mintAddress = new web3.PublicKey(mintAddressString);
    
    // 接收者地址列表
    const recipients = [
      '2iwLxeoaHRir1yMaApa4GC98eJkNdDDAToKkwsVYQzQR',
      '4eVWPSBoM4zNXUxwJ6s51YnCLXcKd6rdF5FEiMU8efa1',
      'Fi2TTcki6gaUHapMKqoGd3Qx1bzPygTiDsfHRhxkJwtq'
    ];
    
    // 转账金额
    const amount = 0.21;
    const amountPerRecipient = amount / recipients.length;
    const amountLamports = Math.floor(amountPerRecipient * 10**9); // 精度为9
    
    console.log(`每个接收者将收到 ${amountPerRecipient} 个代币`);
    
    // 获取管理员代币账户
    const adminTokenAccount = await token.getAssociatedTokenAddress(
      mintAddress,
      adminKeypair.publicKey
    );
    
    // 检查管理员余额
    const adminTokenInfo = await connection.getAccountInfo(adminTokenAccount);
    if (!adminTokenInfo) {
      throw new Error('管理员代币账户不存在');
    }
    
    const adminTokenData = token.AccountLayout.decode(adminTokenInfo.data);
    const adminTokenBalance = Number(adminTokenData.amount) / (10 ** 9);
    console.log(`管理员代币余额: ${adminTokenBalance}`);
    
    if (adminTokenBalance < amount) {
      throw new Error(`管理员代币余额不足。当前余额: ${adminTokenBalance}，需要: ${amount}`);
    }
    
    // 准备所有接收者的代币账户
    const recipientAccounts = [];
    for (const recipientAddress of recipients) {
      const recipient = new web3.PublicKey(recipientAddress);
      const recipientTokenAccount = await token.getAssociatedTokenAddress(
        mintAddress,
        recipient
      );
      
      // 检查账户是否存在
      const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
      
      if (!accountInfo) {
        console.log(`接收者 ${recipientAddress} 的代币账户不存在，创建中...`);
        
        // 创建接收者代币账户
        const createTx = new web3.Transaction().add(
          token.createAssociatedTokenAccountInstruction(
            adminKeypair.publicKey,
            recipientTokenAccount,
            recipient,
            mintAddress
          )
        );
        
        const createOptions: web3.ConfirmOptions = {
          skipPreflight: false,
          preflightCommitment: 'confirmed' as web3.Commitment
        };
        
        const createSignature = await web3.sendAndConfirmTransaction(
          connection,
          createTx,
          [adminKeypair],
          createOptions
        );
        
        console.log(`创建接收者 ${recipientAddress} 的代币账户成功: ${createSignature}`);
      } else {
        console.log(`接收者 ${recipientAddress} 的代币账户已存在`);
      }
      
      recipientAccounts.push({
        address: recipientAddress,
        tokenAccount: recipientTokenAccount,
        balanceBefore: accountInfo ? 
          Number(token.AccountLayout.decode(accountInfo.data).amount) / (10 ** 9) : 0
      });
    }
    
    // 创建所有转账交易
    const transactions = [];
    for (const recipient of recipientAccounts) {
      const transferTx = new web3.Transaction().add(
        token.createTransferInstruction(
          adminTokenAccount,
          recipient.tokenAccount,
          adminKeypair.publicKey,
          amountLamports
        )
      );
      
      // 添加最近的区块哈希，确保每个交易都有唯一的签名
      transferTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transferTx.feePayer = adminKeypair.publicKey;
      
      // 签名交易
      transferTx.sign(adminKeypair);
      
      transactions.push({
        recipient: recipient.address,
        transaction: transferTx,
        serialized: transferTx.serialize()
      });
    }
    
    console.log(`已准备 ${transactions.length} 个交易，开始并发发送...`);
    const startTime = Date.now();
    
    // 并发发送所有交易
    const results = await Promise.allSettled(
      transactions.map(async (tx) => {
        try {
          // 发送已签名的交易
          const signature = await connection.sendRawTransaction(
            tx.serialized,
            {
              skipPreflight: false,
              preflightCommitment: 'confirmed' as web3.Commitment,
              maxRetries: 3
            }
          );
          
          return {
            recipient: tx.recipient,
            signature,
            status: 'sent'
          };
        } catch (error) {
          return {
            recipient: tx.recipient,
            error: String(error),
            status: 'failed'
          };
        }
      })
    );
    
    const endTime = Date.now();
    console.log(`所有交易发送完成，耗时: ${endTime - startTime}ms`);
    
    // 等待所有交易确认
    console.log('等待交易确认...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查所有交易结果
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const recipient = recipientAccounts[i];
      
      if (result.status === 'fulfilled') {
        const txResult = result.value;
        if (txResult.status === 'sent' && txResult.signature) {
          console.log(`接收者 ${txResult.recipient} 的交易已发送，签名: ${txResult.signature}`);
          
          try {
            // 获取最新的区块哈希信息
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            
            // 创建确认策略
            const confirmationStrategy: web3.TransactionConfirmationStrategy = {
              signature: txResult.signature,
              blockhash: blockhash,
              lastValidBlockHeight: lastValidBlockHeight
            };
            
            // 确认交易
            await connection.confirmTransaction(confirmationStrategy);
            console.log(`接收者 ${txResult.recipient} 的交易已确认`);
            
            // 查询新余额
            const accountInfo = await connection.getAccountInfo(recipient.tokenAccount);
            if (accountInfo) {
              const newBalance = Number(token.AccountLayout.decode(accountInfo.data).amount) / (10 ** 9);
              console.log(`接收者 ${txResult.recipient} 的余额: ${recipient.balanceBefore} -> ${newBalance}`);
              console.log(`余额变化: ${newBalance - recipient.balanceBefore}`);
            }
          } catch (error) {
            console.error(`确认接收者 ${txResult.recipient} 的交易失败: ${error}`);
          }
        } else {
          console.error(`接收者 ${txResult.recipient} 的交易发送失败或没有有效签名: ${txResult.error || '无签名'}`);
        }
      } else {
        console.error(`接收者 ${recipient.address} 的交易处理失败: ${result.reason}`);
      }
    }
    
    console.log('并发转账测试完成');
  } catch (error) {
    console.error('并发转账测试失败:', error);
  }
}

concurrentTransfer(); 