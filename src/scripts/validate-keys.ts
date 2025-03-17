import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

function validatePublicKey(keyString: string, keyName: string): void {
  try {
    const publicKey = new web3.PublicKey(keyString);
    console.log(`✅ ${keyName} 格式有效: ${publicKey.toString()}`);
  } catch (error: unknown) {
    console.error(`❌ ${keyName} 格式无效: ${keyString}`);
    
    // 安全地访问error.message
    if (error instanceof Error) {
      console.error(`错误: ${error.message}`);
    } else {
      console.error(`错误: ${String(error)}`);
    }
  }
}

// 验证测试钱包地址
validatePublicKey('4eVWPSBoM4zNXUxwJ6s51YnCLXcKd6rdF5FEiMU8efa1', '测试钱包地址');

// 验证代币铸造地址
validatePublicKey('QBASpHh6QM4EMfDGyH4vv5CExFfLMzvsy5R1XRgxBU5', '代币铸造地址');

// 从环境变量获取并验证
if (process.env.MINT_ADDRESS) {
  validatePublicKey(process.env.MINT_ADDRESS, '环境变量中的代币铸造地址');
} 