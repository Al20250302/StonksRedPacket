import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import { WalletManager } from '../services/walletManager.service';
import { RpcManager } from '../services/rpcManager.service';
import { TokenUtils } from '../utils/token.utils';
import dotenv from 'dotenv';

dotenv.config();

async function optimizedConcurrentTransfer() {
  try {
    console.log('执行优化的并发转账测试...');
    
    // 使用RPC管理器
    const rpcManager = new RpcManager();
    const connection = rpcManager.createConnection({
      commitment: 'confirmed' as web3.Commitment,
      confirmTransactionInitialTimeout: 60000,
    });
    
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
    
    // 转账金额 - 使用TokenUtils避免精度问题
    const totalAmount = 0.21;
    const parts = recipients.length;
    const amountPerRecipientLamports = TokenUtils.distributeTokens(totalAmount, parts);
    const amountPerRecipient = TokenUtils.fromTokenAmount(amountPerRecipientLamports);
    
    console.log(`每个接收者将收到 ${TokenUtils.formatTokenAmount(amountPerRecipient)} 个代币`);
    
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
    console.log(`管理员代币余额: ${TokenUtils.formatTokenAmount(adminTokenBalance)}`);
    
    if (adminTokenBalance < totalAmount) {
      throw new Error(`管理员代币余额不足。当前余额: ${adminTokenBalance}，需要: ${totalAmount}`);
    }
    
    // 准备所有接收者的代币账户 - 使用RPC管理器处理限流
    const recipientAccounts = [];
    for (const recipientAddress of recipients) {
      const recipient = new web3.PublicKey(recipientAddress);
      
      // 使用RPC管理器执行操作
      const recipientTokenAccount = await rpcManager.executeWithRetry(async (conn) => {
        const tokenAccount = await token.getAssociatedTokenAddress(
          mintAddress,
          recipient
        );
        
        // 检查账户是否存在
        const accountInfo = await conn.getAccountInfo(tokenAccount);
        
        if (!accountInfo) {
          console.log(`接收者 ${recipientAddress} 的代币账户不存在，创建中...`);
          
          // 创建接收者代币账户
          const createTx = new web3.Transaction().add(
            token.createAssociatedTokenAccountInstruction(
              adminKeypair.publicKey,
              tokenAccount,
              recipient,
              mintAddress
            )
          );
          
          const createOptions: web3.ConfirmOptions = {
            skipPreflight: false,
            preflightCommitment: 'confirmed' as web3.Commitment
          };
          
          const createSignature = await web3.sendAndConfirmTransaction(
            conn,
            createTx,
            [adminKeypair],
            createOptions
          );
          
          console.log(`创建接收者 ${recipientAddress} 的代币账户成功: ${createSignature}`);
        } else {
          console.log(`接收者 ${recipientAddress} 的代币账户已存在`);
        }
        
        // 获取当前余额
        let balanceBefore = 0;
        if (accountInfo) {
          balanceBefore = Number(token.AccountLayout.decode(accountInfo.data).amount) / (10 ** 9);
        }
        
        return {
          tokenAccount,
          balanceBefore
        };
      });
      
      recipientAccounts.push({
        address: recipientAddress,
        tokenAccount: recipientTokenAccount.tokenAccount,
        balanceBefore: recipientTokenAccount.balanceBefore
      });
    }
    
    // 创建所有转账交易
    const transactions = [];
    for (const recipient of recipientAccounts) {
      // 使用RPC管理器获取最新区块哈希
      const { blockhash, lastValidBlockHeight } = await rpcManager.executeWithRetry(
        conn => conn.getLatestBlockhash()
      );
      
      const transferTx = new web3.Transaction().add(
        token.createTransferInstruction(
          adminTokenAccount,
          recipient.tokenAccount,
          adminKeypair.publicKey,
          amountPerRecipientLamports
        )
      );
      
      // 添加最近的区块哈希
      transferTx.recentBlockhash = blockhash;
      transferTx.lastValidBlockHeight = lastValidBlockHeight;
      transferTx.feePayer = adminKeypair.publicKey;
      
      // 签名交易
      transferTx.sign(adminKeypair);
      
      transactions.push({
        recipient: recipient.address,
        transaction: transferTx,
        serialized: transferTx.serialize(),
        blockhash,
        lastValidBlockHeight
      });
    }
    
    console.log(`已准备 ${transactions.length} 个交易，开始并发发送...`);
    const startTime = Date.now();
    
    // 并发发送所有交易 - 使用RPC管理器处理限流
    const results = await Promise.allSettled(
      transactions.map(async (tx, index) => {
        return rpcManager.executeWithRetry(async (conn) => {
          try {
            // 发送已签名的交易
            const signature = await conn.sendRawTransaction(
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
              status: 'sent',
              blockhash: tx.blockhash,
              lastValidBlockHeight: tx.lastValidBlockHeight
            };
          } catch (error) {
            return {
              recipient: tx.recipient,
              error: String(error),
              status: 'failed'
            };
          }
        });
      })
    );
    
    const endTime = Date.now();
    console.log(`所有交易发送完成，耗时: ${endTime - startTime}ms`);
    
    // 等待所有交易确认 - 使用更长的等待时间
    console.log('等待交易确认...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 检查所有交易结果 - 使用RPC管理器处理限流
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const recipient = recipientAccounts[i];
      
      if (result.status === 'fulfilled') {
        const txResult = result.value;
        if (txResult.status === 'sent' && txResult.signature) {
          console.log(`接收者 ${txResult.recipient} 的交易已发送，签名: ${txResult.signature}`);
          
          try {
            // 使用RPC管理器确认交易
            await rpcManager.executeWithRetry(async (conn) => {
              // 创建确认策略
              const confirmationStrategy: web3.TransactionConfirmationStrategy = {
                signature: txResult.signature,
                blockhash: txResult.blockhash,
                lastValidBlockHeight: txResult.lastValidBlockHeight
              };
              
              // 确认交易
              await conn.confirmTransaction(confirmationStrategy);
              console.log(`接收者 ${txResult.recipient} 的交易已确认`);
              
              // 查询新余额
              const accountInfo = await conn.getAccountInfo(recipient.tokenAccount);
              if (accountInfo) {
                const newBalance = Number(token.AccountLayout.decode(accountInfo.data).amount) / (10 ** 9);
                console.log(`接收者 ${txResult.recipient} 的余额: ${TokenUtils.formatTokenAmount(recipient.balanceBefore)} -> ${TokenUtils.formatTokenAmount(newBalance)}`);
                console.log(`余额变化: ${TokenUtils.formatTokenAmount(newBalance - recipient.balanceBefore)}`);
              }
            });
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
    
    console.log('优化的并发转账测试完成');
  } catch (error) {
    console.error('优化的并发转账测试失败:', error);
  }
}

optimizedConcurrentTransfer(); 