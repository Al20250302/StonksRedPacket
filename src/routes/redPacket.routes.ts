import { Router } from 'express';
import { RedPacketController } from '../controllers/redPacket.controller';

export const redPacketRoutes = Router();
const controller = new RedPacketController();

// 创建红包
redPacketRoutes.post('/create', controller.createRedPacket);

// 领取红包
redPacketRoutes.post('/claim', controller.claimRedPacket);

// 获取红包信息
redPacketRoutes.get('/:id', controller.getRedPacketInfo);

// 获取用户创建的红包列表
redPacketRoutes.get('/created/:address', controller.getUserCreatedRedPackets);

// 获取用户领取的红包列表
redPacketRoutes.get('/received/:address', controller.getUserReceivedRedPackets); 