import * as web3 from '@solana/web3.js';
import * as token from '@solana/spl-token';
import * as fs from 'fs';
import { WalletManager } from '../services/walletManager.service';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdminWallet() {
  try {
    console.log('检查管理员钱包状态...');
    
    // 初始化
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
    const walletManager = new WalletManager();
    
    // 获取管理员钱包路径
    const walletPath = walletManager.getAdminWalletPath();
    console.log(`管理员钱包路径: ${walletPath}`);
    
    // 读取钱包
    const secretKeyString = fs.readFileSync(walletPath, 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const adminKeypair = web3.Keypair.fromSecretKey(secretKey);
    
    // 获取管理员公钥
    const adminPublicKey = adminKeypair.publicKey;
    console.log(`管理员公钥: ${adminPublicKey.toString()}`);
    
    // 检查SOL余额
    const solBalance = await connection.getBalance(adminPublicKey);
    console.log(`SOL余额: ${solBalance / web3.LAMPORTS_PER_SOL} SOL`);
    
    if (solBalance < web3.LAMPORTS_PER_SOL * 0.05) {
      console.warn('⚠️ SOL余额较低，可能无法支付交易费用');
      console.log('请确保您的主网钱包中有足够的SOL');
    }
    
    // 获取代币铸造地址
    const mintAddressString = walletManager.getMintAddress();
    const mintAddress = new web3.PublicKey(mintAddressString);
    console.log(`代币铸造地址: ${mintAddress.toString()}`);
    
    // 获取管理员的代币账户
    const tokenAccount = await token.getAssociatedTokenAddress(
      mintAddress,
      adminPublicKey
    );
    
    console.log(`管理员代币账户地址: ${tokenAccount.toString()}`);
    
    // 检查代币账户是否存在
    const tokenAccountInfo = await connection.getAccountInfo(tokenAccount);
    
    if (!tokenAccountInfo) {
      console.warn('⚠️ 管理员没有代币账户，需要先创建并获取一些代币');
      console.log('请先获取一些代币，或者使用以下命令创建代币账户:');
      console.log(`spl-token create-account ${mintAddress.toString()} --owner ${adminPublicKey.toString()}`);
    } else {
      // 解析代币余额
      const accountData = token.AccountLayout.decode(tokenAccountInfo.data);
      const tokenBalance = Number(accountData.amount) / (10 ** 9);
      console.log(`代币余额: ${tokenBalance}`);
      
      if (tokenBalance === 0) {
        console.warn('⚠️ 代币余额为零，无法执行转账操作');
        console.log('请先获取一些代币');
      }
    }
    
    console.log('管理员钱包检查完成');
  } catch (error) {
    console.error('检查管理员钱包失败:', error);
  }
}

checkAdminWallet(); 