import dotenv from 'dotenv';
import { WalletManager } from '../services/walletManager.service';
import { WalletService } from '../services/wallet.service';

dotenv.config();

async function testWallet() {
  try {
    console.log('测试钱包连接...');
    
    // 初始化钱包管理器
    const walletManager = new WalletManager();
    
    // 获取管理员钱包路径
    const walletPath = walletManager.getAdminWalletPath();
    console.log(`管理员钱包路径: ${walletPath}`);
    
    // 获取管理员公钥
    const publicKey = await walletManager.getAdminPublicKey();
    console.log(`管理员公钥: ${publicKey}`);
    
    // 获取代币铸造地址
    const mintAddress = walletManager.getMintAddress();
    console.log(`代币铸造地址: ${mintAddress}`);
    
    console.log('钱包连接测试完成');
  } catch (error) {
    console.error('钱包连接测试失败:', error);
  }
}

testWallet(); 