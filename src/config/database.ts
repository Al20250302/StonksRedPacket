import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 确保在这里再次加载环境变量
dotenv.config();

// 获取环境变量中的MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

// 检查连接字符串是否存在
if (!MONGODB_URI) {
  console.error('❌ 错误：MONGODB_URI 环境变量未设置！');
  console.error('请确保在.env文件中设置了正确的MONGODB_URI');
  process.exit(1);
}

export const connectDB = async (): Promise<void> => {
  try {
    // 显示要连接的URL（隐藏密码）
    const maskedUri = MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:******@');
    console.log(`尝试连接到MongoDB: ${maskedUri}`);
    
    // 设置连接选项
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };
    
    // 连接到数据库
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB 连接成功！');
  } catch (error: any) {
    console.error('❌ 数据库连接失败详细信息:');
    console.error(error);
    
    // 更详细的错误诊断
    if (error.name === 'MongoServerSelectionError') {
      console.error('无法连接到MongoDB服务器。可能原因：');
      console.error('1. 网络连接问题');
      console.error('2. MongoDB Atlas网络访问限制（未添加您的IP地址）');
      console.error('3. Atlas集群未启动或处于维护状态');
      
      // 检查连接字符串
      console.error('\n当前尝试连接的是:');
      if (MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1')) {
        console.error('- 本地MongoDB服务器。请确保本地MongoDB已启动，或修改为Atlas连接字符串');
      } else if (MONGODB_URI.includes('mongodb+srv')) {
        console.error('- MongoDB Atlas。请检查Atlas控制台中的网络访问设置和集群状态');
      }
    }
    
    if (error.message?.includes('Authentication failed')) {
      console.error('认证失败。请检查用户名和密码是否正确。');
    }
    
    if (error.message?.includes('ENOTFOUND')) {
      console.error('域名解析失败。请检查连接字符串中的主机名是否正确。');
    }
    
    // 不立即退出，让用户有机会查看错误信息
    console.error('\n请检查您的.env文件，确保MONGODB_URI设置正确');
    // process.exit(1);
  }
}; 