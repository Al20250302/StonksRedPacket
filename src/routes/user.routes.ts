import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

export const userRoutes = Router();
const controller = new UserController();

// 获取用户余额
userRoutes.get('/balance/:address', controller.getBalance);

// 切换管理员钱包
userRoutes.post('/admin/wallet', controller.changeAdminWallet); 