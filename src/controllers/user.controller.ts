import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { WalletManager } from '../services/walletManager.service';

export class UserController {
  private walletService: WalletService;
  private walletManager: WalletManager;
  
  constructor() {
    this.walletService = new WalletService();
    this.walletManager = new WalletManager();
  }
  
  // 获取用户余额
  getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;
      
      if (!address) {
        res.status(400).json({ success: false, message: '缺少钱包地址' });
        return;
      }
      
      const balance = await this.walletService.getTokenBalance(address);
      
      res.status(200).json({ 
        success: true, 
        data: { 
          address, 
          balance 
        } 
      });
    } catch (error) {
      console.error('获取余额失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
  
  // 切换管理员钱包
  changeAdminWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyPath, mintAddress } = req.body;
      
      if (!keyPath) {
        res.status(400).json({ success: false, message: '缺少钱包路径' });
        return;
      }
      
      await this.walletManager.switchAdminWallet(keyPath, mintAddress);
      
      res.status(200).json({ 
        success: true, 
        message: '管理员钱包切换成功' 
      });
    } catch (error) {
      console.error('切换管理员钱包失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
} 