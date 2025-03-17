import dotenv from 'dotenv';
import { WalletManager } from '../services/walletManager.service';

dotenv.config();

async function testWalletSwitch() {
  try {
    console.log('测试钱包切换...');
    
    const walletManager = new WalletManager();
    
    // 获取当前钱包信息
    const currentWalletPath = walletManager.getAdminWalletPath();
    const currentPublicKey = await walletManager.getAdminPublicKey();
    console.log(`当前钱包路径: ${currentWalletPath}`);
    console.log(`当前钱包公钥: ${currentPublicKey}`);
    
    // 如果有备用钱包，可以测试切换
    // const newWalletPath = '/path/to/backup/wallet.json';
    // await walletManager.switchAdminWallet(newWalletPath);
    
    // 切换后获取钱包信息
    // const newPublicKey = await walletManager.getAdminPublicKey();
    // console.log(`切换后钱包公钥: ${newPublicKey}`);
    
    // 切换回原钱包
    // await walletManager.switchAdminWallet(currentWalletPath);
    
    console.log('钱包切换测试完成');
  } catch (error) {
    console.error('钱包切换测试失败:', error);
  }
}

testWalletSwitch(); 