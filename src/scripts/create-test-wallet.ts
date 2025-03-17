import * as web3 from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

async function createTestWallet() {
  try {
    console.log('创建测试钱包...');
    
    // 生成新钱包
    const keypair = web3.Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const secretKey = Array.from(keypair.secretKey);
    
    console.log(`测试钱包公钥: ${publicKey}`);
    
    // 保存到文件
    const walletDir = path.join(__dirname, '../../wallets');
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }
    
    const walletPath = path.join(walletDir, 'test-wallet.json');
    fs.writeFileSync(walletPath, JSON.stringify(secretKey));
    
    console.log(`测试钱包密钥已保存到: ${walletPath}`);
    console.log('请在测试脚本中使用此公钥作为测试钱包地址');
    
    // 验证公钥格式
    try {
      const validatedKey = new web3.PublicKey(publicKey);
      console.log(`✅ 公钥格式验证通过: ${validatedKey.toString()}`);
    } catch (error) {
      console.error(`❌ 公钥格式验证失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error('创建测试钱包失败:', error instanceof Error ? error.message : String(error));
  }
}

createTestWallet(); 