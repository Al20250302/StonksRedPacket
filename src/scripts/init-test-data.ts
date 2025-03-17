import dotenv from 'dotenv';
import mongoose from 'mongoose';
import RedPacket from '../models/RedPacket';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function initTestData() {
  try {
    console.log('连接到数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('连接成功');
    
    // 清除现有数据
    await RedPacket.deleteMany({});
    console.log('清除现有数据');
    
    // 创建测试红包
    const testRedPacket = new RedPacket({
      creator: 'Fi2TTcki6gaUHapMKqoGd3Qx1bzPygTiDsfHRhxkJwtq',
      tokenAddress: 'QBASpHh6QM4EMfDGyH4vv5CExFfLMzvsy5R1XRgxBU5',
      totalAmount: 100,
      remainingAmount: 100,
      totalCount: 10,
      remainingCount: 10,
      password: 'test123',
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      receivers: [],
      status: 'active'
    });
    
    await testRedPacket.save();
    console.log('测试红包创建成功:', testRedPacket);
    
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('初始化测试数据失败:', error);
  }
}

initTestData(); 