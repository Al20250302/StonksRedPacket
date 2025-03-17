import dotenv from 'dotenv';
import { WalletService } from '../services/wallet.service';
import { WalletManager } from '../services/walletManager.service';

dotenv.config();

async function testBalance() {
  try {
    console.log('测试代币余额查询...');
    
    const walletManager = new WalletManager();
    const adminPublicKey = 'BdB6mqMGsqqhMAEbgt3u1pMTfW6jfasSQduATbmNQSeK'; // 您的管理员公钥
    console.log(`管理员公钥: ${adminPublicKey}`);
    
    const walletService = new WalletService();
    
    // 查询管理员钱包代币余额
    const adminBalance = await walletService.getTokenBalance(adminPublicKey);
    console.log(`管理员钱包代币余额: ${adminBalance}`);
    
    // 查询测试钱包代币余额
    const testWalletAddress = 'Fi2TTcki6gaUHapMKqoGd3Qx1bzPygTiDsfHRhxkJwtq';
    const testBalance = await walletService.getTokenBalance(testWalletAddress);
    console.log(`测试钱包代币余额: ${testBalance}`);
    
    console.log('代币余额查询测试完成');
  } catch (error) {
    console.error('代币余额查询测试失败:', error);
  }
}

testBalance(); 