import mongoose, { Schema, Document } from 'mongoose';

export interface IRedPacket extends Document {
  creator: string;        // 创建者钱包地址
  tokenAddress: string;   // 代币地址
  totalAmount: number;    // 总金额
  remainingAmount: number;// 剩余金额
  totalCount: number;     // 总红包数
  remainingCount: number; // 剩余红包数
  password: string;       // 红包口令
  expiryTime: Date;       // 过期时间
  receivers: Array<{      // 领取记录
    address: string;      // 领取者钱包地址
    amount: number;       // 领取金额
    timestamp: Date;      // 领取时间
  }>;
  createdAt: Date;
  status: string;         // 状态：active, expired, emptied
}

const RedPacketSchema: Schema = new Schema({
  creator: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  totalCount: { type: Number, required: true },
  remainingCount: { type: Number, required: true },
  password: { type: String, required: true },
  expiryTime: { type: Date, required: true },
  receivers: [{
    address: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'active' }
});

export default mongoose.model<IRedPacket>('RedPacket', RedPacketSchema); 