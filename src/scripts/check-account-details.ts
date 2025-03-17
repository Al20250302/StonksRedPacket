import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import { WalletManager } from '../services/walletManager.service';
import dotenv from 'dotenv';

dotenv.config();

async function checkAccountDetails() {
  try {
    // 要检查的地址
    const addressToCheck = 'Fi2TTcki6gaUHapMKqoGd3Qx1bzPygTiDsfHRhxkJwtq';
    console.log(`检查地址: ${addressToCheck}`);
    
    // 初始化
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
    const walletManager = new WalletManager();
    
    // 获取代币铸造地址
    const mintAddressString = walletManager.getMintAddress();
    const mintAddress = new web3.PublicKey(mintAddressString);
    console.log(`代币铸造地址: ${mintAddress.toString()}`);
    
    // 转换为公钥
    const publicKey = new web3.PublicKey(addressToCheck);
    
    // 计算关联代币账户地址
    const tokenAccount = await token.getAssociatedTokenAddress(
      mintAddress,
      publicKey
    );
    
    console.log(`计算出的代币账户地址: ${tokenAccount.toString()}`);
    
    // 获取账户信息
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    
    if (!accountInfo) {
      console.log('账户不存在');
      return;
    }
    
    console.log('账户存在，详细信息:');
    console.log(`- 所有者程序: ${accountInfo.owner.toString()}`);
    console.log(`- 可执行: ${accountInfo.executable}`);
    console.log(`- 租金豁免: ${accountInfo.rentEpoch}`);
    console.log(`- 数据长度: ${accountInfo.data.length} 字节`);
    
    // 检查是否是SPL代币账户
    const isTokenAccount = accountInfo.owner.equals(token.TOKEN_PROGRAM_ID);
    console.log(`是SPL代币账户: ${isTokenAccount}`);
    
    if (isTokenAccount) {
      try {
        // 尝试解析为代币账户
        const tokenAccountInfo = token.AccountLayout.decode(accountInfo.data);
        console.log('代币账户数据:');
        console.log(`- 铸造地址: ${new web3.PublicKey(tokenAccountInfo.mint).toString()}`);
        console.log(`- 所有者: ${new web3.PublicKey(tokenAccountInfo.owner).toString()}`);
        console.log(`- 余额: ${Number(tokenAccountInfo.amount) / (10 ** 9)}`);
      } catch (error) {
        console.error('解析代币账户数据失败:', error);
      }
    }
  } catch (error) {
    console.error('检查账户详情失败:', error);
  }
}

checkAccountDetails(); 