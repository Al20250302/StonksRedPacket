import * as fs from 'fs';
import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';

export class WalletManager {
  private static adminWalletPath: string = '/Users/yuexi/.config/solana/id.json';
  private static mintAddressString: string = 'QBASpHh6QM4EMfDGyH4vv5CExFfLMzvsy5R1XRgxBU5';
  
  // 获取当前管理员钱包路径
  getAdminWalletPath(): string {
    return WalletManager.adminWalletPath;
  }
  
  // 获取当前代币铸造地址
  getMintAddress(): string {
    return WalletManager.mintAddressString;
  }
  
  // 切换管理员钱包
  async switchAdminWallet(keyPath: string, mintAddress?: string): Promise<void> {
    try {
      // 验证钱包文件是否存在
      if (!fs.existsSync(keyPath)) {
        throw new Error('钱包文件不存在');
      }
      
      // 验证钱包文件格式是否正确
      const secretKeyString = fs.readFileSync(keyPath, 'utf8');
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      
      // 验证是否能生成有效的Keypair
      const keypair = web3.Keypair.fromSecretKey(secretKey);
      
      // 如果提供了新的代币铸造地址，则进行验证
      if (mintAddress) {
        try {
          new web3.PublicKey(mintAddress);
          WalletManager.mintAddressString = mintAddress;
        } catch (error) {
          throw new Error('无效的代币铸造地址');
        }
      }
      
      // 更新管理员钱包路径
      WalletManager.adminWalletPath = keyPath;
      
      console.log(`管理员钱包已切换到: ${keyPath}`);
      if (mintAddress) {
        console.log(`代币铸造地址已更新为: ${mintAddress}`);
      }
    } catch (error) {
      console.error('切换管理员钱包失败:', error);
      throw error;
    }
  }
  
  // 获取管理员钱包的公钥
  getAdminPublicKey(): string {
    try {
      const walletPath = this.getAdminWalletPath();
      const secretKeyString = fs.readFileSync(walletPath, 'utf8');
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      const keypair = web3.Keypair.fromSecretKey(secretKey);
      return keypair.publicKey.toString();
    } catch (error) {
      console.error(`获取管理员公钥失败: ${error}`);
      throw new Error(`无法获取管理员公钥: ${error}`);
    }
  }
} 