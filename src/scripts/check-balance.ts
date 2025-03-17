import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function checkBalance() {
  try {
    // 获取要检查的地址
    const addressToCheck = '4eVWPSBoM4zNXUxwJ6s51YnCLXcKd6rdF5FEiMU8efa1';
    const mintAddressStr = 'QBASpHh6QM4EMfDGyH4vv5CExFfLMzvsy5R1XRgxBU5';
    
    console.log(`检查地址 ${addressToCheck} 的 ${mintAddressStr} 代币余额`);
    
    // 连接到Solana
    console.log('连接到Solana主网...');
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
    
    // 转换公钥
    const publicKey = new web3.PublicKey(addressToCheck);
    const mintAddress = new web3.PublicKey(mintAddressStr);
    
    console.log('获取所有代币账户...');
    // 获取所有代币账户
    const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: token.TOKEN_PROGRAM_ID }
    );
    
    console.log(`找到 ${allTokenAccounts.value.length} 个代币账户:`);
    
    // 打印所有代币账户
    for (const account of allTokenAccounts.value) {
      const mintInfo = account.account.data.parsed.info.mint;
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
      console.log(`代币: ${mintInfo}, 余额: ${balance}`);
    }
    
    // 尝试获取特定代币
    console.log('尝试获取特定代币账户...');
    try {
      const tokenAccount = await token.getAssociatedTokenAddress(
        mintAddress,
        publicKey
      );
      
      console.log(`检查代币账户: ${tokenAccount.toString()}`);
      const accountInfo = await connection.getAccountInfo(tokenAccount);
      
      if (accountInfo) {
        console.log('账户存在!');
      } else {
        console.log('账户不存在!');
      }
    } catch (err) {
      console.error('获取关联代币账户失败:', err);
    }
    
  } catch (error) {
    console.error('检查余额失败:', error);
  }
}

checkBalance(); 