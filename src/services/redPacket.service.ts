import RedPacket, { IRedPacket } from '../models/RedPacket';
import { WalletService } from './wallet.service';

export class RedPacketService {
  private walletService: WalletService;
  
  constructor() {
    this.walletService = new WalletService();
  }
  
  // 创建红包
  async createRedPacket(
    creator: string,
    tokenAddress: string,
    totalAmount: number,
    totalCount: number,
    password: string,
    expiryHours: number
  ): Promise<IRedPacket> {
    // 计算过期时间
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + expiryHours);
    
    // 创建红包记录
    const redPacket = new RedPacket({
      creator,
      tokenAddress,
      totalAmount,
      remainingAmount: totalAmount,
      totalCount,
      remainingCount: totalCount,
      password,
      expiryTime,
      receivers: [],
      status: 'active'
    });
    
    await redPacket.save();
    return redPacket;
  }
  
  // 领取红包
  async claimRedPacket(password: string, receiverAddress: string): Promise<{ success: boolean, amount?: number, message?: string }> {
    // 查找红包
    const redPacket = await RedPacket.findOne({
      password,
      status: 'active',
      expiryTime: { $gt: new Date() },
      remainingCount: { $gt: 0 }
    });
    
    if (!redPacket) {
      return { success: false, message: '红包不存在或已过期' };
    }
    
    // 检查用户是否已领取
    const hasReceived = redPacket.receivers.some(r => r.address === receiverAddress);
    if (hasReceived) {
      return { success: false, message: '您已领取过此红包' };
    }
    
    // 计算领取金额（随机或平均）
    let amount: number;
    if (redPacket.remainingCount === 1) {
      // 最后一个红包，剩余全部金额
      amount = redPacket.remainingAmount;
    } else {
      // 随机金额，确保在合理范围内
      const minAmount = 0.01; // 最低金额
      const maxPossible = redPacket.remainingAmount - minAmount * (redPacket.remainingCount - 1);
      amount = Math.random() * (maxPossible - minAmount) + minAmount;
      amount = Math.round(amount * 100) / 100; // 保留两位小数
    }
    
    // 发送代币
    try {
      const txSignature = await this.walletService.sendTokens(receiverAddress, amount);
      
      // 更新红包状态
      redPacket.remainingAmount -= amount;
      redPacket.remainingCount -= 1;
      redPacket.receivers.push({
        address: receiverAddress,
        amount,
        timestamp: new Date()
      });
      
      // 如果红包已抢完，更新状态
      if (redPacket.remainingCount === 0) {
        redPacket.status = 'emptied';
      }
      
      await redPacket.save();
      
      return { success: true, amount };
    } catch (error) {
      console.error('发送代币失败:', error);
      return { success: false, message: '代币发送失败' };
    }
  }
  
  // 获取红包信息
  async getRedPacketInfo(redPacketId: string): Promise<IRedPacket | null> {
    return RedPacket.findById(redPacketId);
  }
  
  // 获取用户创建的红包列表
  async getUserCreatedRedPackets(creatorAddress: string): Promise<IRedPacket[]> {
    return RedPacket.find({ creator: creatorAddress }).sort({ createdAt: -1 });
  }
  
  // 获取用户领取的红包列表
  async getUserReceivedRedPackets(receiverAddress: string): Promise<any[]> {
    const redPackets = await RedPacket.find({
      'receivers.address': receiverAddress
    });
    
    return redPackets.map(rp => {
      const receiverInfo = rp.receivers.find(r => r.address === receiverAddress);
      return {
        redPacketId: rp._id,
        creator: rp.creator,
        password: rp.password,
        amount: receiverInfo?.amount,
        claimedAt: receiverInfo?.timestamp,
        totalAmount: rp.totalAmount,
        totalCount: rp.totalCount
      };
    });
  }
} 