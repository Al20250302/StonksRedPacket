import dotenv from 'dotenv';
import { WalletService } from '../services/wallet.service';

dotenv.config();

async function testTransfer() {
  try {
    console.log('测试代币转账...');
    
    const walletService = new WalletService();
    // 使用已验证的钱包地址
    const testWalletAddress = 'Fi2TTcki6gaUHapMKqoGd3Qx1bzPygTiDsfHRhxkJwtq';
    
    // 转账前查询余额
    const balanceBefore = await walletService.getTokenBalance(testWalletAddress);
    console.log(`转账前测试钱包余额: ${balanceBefore}`);
    
    // 执行转账
    const amount = 0.01;
    console.log(`尝试转账 ${amount} 个代币到 ${testWalletAddress}`);
    
    const signature = await walletService.sendTokens(testWalletAddress, amount);
    console.log(`转账成功，交易签名: ${signature}`);
    
    // 等待交易确认
    console.log('等待交易确认...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 转账后查询余额
    const balanceAfter = await walletService.getTokenBalance(testWalletAddress);
    console.log(`转账后测试钱包余额: ${balanceAfter}`);
    console.log(`余额变化: ${balanceAfter - balanceBefore}`);
    
    console.log('代币转账测试完成');
  } catch (error) {
    console.error('代币转账测试失败:', error);
  }
}

testTransfer(); 