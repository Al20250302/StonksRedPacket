import * as web3 from '@solana/web3.js';
import { WalletService } from '../services/wallet.service';
import dotenv from 'dotenv';

dotenv.config();

async function testNewTransfer() {
  try {
    console.log('测试代币转账到新地址...');
    
    // 生成一个全新的接收者地址
    const newRecipient = web3.Keypair.generate();
    const newRecipientAddress = newRecipient.publicKey.toString();
    
    console.log(`生成的新接收者地址: ${newRecipientAddress}`);
    
    const walletService = new WalletService();
    
    // 执行转账（小额测试）
    const amount = 0.001; // 使用更小的金额测试
    console.log(`尝试转账 ${amount} 个代币到新地址 ${newRecipientAddress}`);
    
    const signature = await walletService.sendTokens(newRecipientAddress, amount);
    console.log(`转账成功，交易签名: ${signature}`);
    
    // 等待交易确认
    console.log('等待交易确认...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 查询余额
    const balance = await walletService.getTokenBalance(newRecipientAddress);
    console.log(`新地址代币余额: ${balance}`);
    
    console.log('代币转账测试完成');
  } catch (error) {
    console.error('代币转账测试失败:', error);
  }
}

testNewTransfer(); 