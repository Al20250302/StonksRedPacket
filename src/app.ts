import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { redPacketRoutes } from './routes/redPacket.routes';
import { userRoutes } from './routes/user.routes';
import { connectDB } from './config/database';

// 加载环境变量
dotenv.config();

// 打印环境变量（仅开发时使用，上线前删除）
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已设置' : '未设置');
console.log('MONGODB_URI的前15个字符:', process.env.MONGODB_URI?.substring(0, 15));

// 连接数据库
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/redpacket', redPacketRoutes);
app.use('/api/user', userRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 