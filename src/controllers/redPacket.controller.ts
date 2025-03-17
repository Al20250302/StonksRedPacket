import { Request, Response } from 'express';
import { RedPacketService } from '../services/redPacket.service';

export class RedPacketController {
  private redPacketService: RedPacketService;
  
  constructor() {
    this.redPacketService = new RedPacketService();
  }
  
  // 创建红包
  createRedPacket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        creator, 
        tokenAddress, 
        totalAmount, 
        totalCount, 
        password, 
        expiryHours 
      } = req.body;
      
      if (!creator || !tokenAddress || !totalAmount || !totalCount || !password || !expiryHours) {
        res.status(400).json({ success: false, message: '缺少必要参数' });
        return;
      }
      
      const redPacket = await this.redPacketService.createRedPacket(
        creator,
        tokenAddress,
        totalAmount,
        totalCount,
        password,
        expiryHours
      );
      
      res.status(201).json({ 
        success: true, 
        data: redPacket,
        message: '红包创建成功'
      });
    } catch (error) {
      console.error('创建红包失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
  
  // 领取红包
  claimRedPacket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password, receiverAddress } = req.body;
      
      if (!password || !receiverAddress) {
        res.status(400).json({ success: false, message: '缺少必要参数' });
        return;
      }
      
      const result = await this.redPacketService.claimRedPacket(password, receiverAddress);
      
      if (result.success) {
        res.status(200).json({ 
          success: true, 
          amount: result.amount,
          message: `恭喜获得 ${result.amount} 个代币！` 
        });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error('领取红包失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
  
  // 获取红包信息
  getRedPacketInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const redPacket = await this.redPacketService.getRedPacketInfo(id);
      
      if (!redPacket) {
        res.status(404).json({ success: false, message: '红包不存在' });
        return;
      }
      
      res.status(200).json({ success: true, data: redPacket });
    } catch (error) {
      console.error('获取红包信息失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
  
  // 获取用户创建的红包列表
  getUserCreatedRedPackets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;
      const redPackets = await this.redPacketService.getUserCreatedRedPackets(address);
      
      res.status(200).json({ success: true, data: redPackets });
    } catch (error) {
      console.error('获取用户创建的红包列表失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
  
  // 获取用户领取的红包列表
  getUserReceivedRedPackets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params;
      const redPackets = await this.redPacketService.getUserReceivedRedPackets(address);
      
      res.status(200).json({ success: true, data: redPackets });
    } catch (error) {
      console.error('获取用户领取的红包列表失败:', error);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  };
} 