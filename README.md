
# StonksRedPacket

基于Solana的代币转账系统，支持单笔和并发转账操作。

## 功能特性

- 支持单笔代币转账
- 支持并发批量转账
- 自动处理API限流
- 精确的代币金额计算
- 完整的错误处理机制

## 项目结构

```
src/
├── services/
│   ├── wallet.service.ts         # 钱包服务
│   ├── walletManager.service.ts  # 钱包管理
│   └── rpcManager.service.ts     # RPC节点管理
├── utils/
│   └── token.utils.ts            # 代币工具
└── scripts/
    ├── check-balance.ts          # 余额查询
    ├── test-transfer.ts          # 转账测试
    ├── simple-transfer.ts        # 简单转账
    ├── fast-transfer.ts          # 快速转账
    └── concurrent-transfer.ts    # 并发转账
```

## 环境要求

- Node.js >= 14
- TypeScript >= 4
- Solana CLI Tools
- Git

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/Al20250302/StonksRedPacket.git
cd StonksRedPacket
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置

在项目根目录创建 `.env` 文件，添加以下配置：
```plaintext
# Solana网络配置
SOLANA_NETWORK=mainnet-beta  # 或 devnet/testnet

# 管理员钱包配置
ADMIN_WALLET_PATH=/path/to/your/wallet.json

# 代币配置
MINT_ADDRESS=your_token_mint_address

# RPC节点配置（可选）
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
```

### 4. 测试脚本使用

1. **检查余额**
```bash
npx ts-node src/scripts/check-balance.ts
```

2. **执行单笔转账**
```bash
npx ts-node src/scripts/simple-transfer.ts
```

3. **执行并发转账**
```bash
npx ts-node src/scripts/concurrent-transfer.ts
```

4. **快速转账测试**
```bash
npx ts-node src/scripts/fast-transfer.ts
```

## 开发指南

### API限流处理
系统已实现自动处理API限流问题：
- 多个RPC节点自动切换
- 指数退避重试策略
- 错误自动恢复

### 代币精度处理
使用 `TokenUtils` 处理代币精度问题：
- BigInt处理大数字
- 自动处理小数位
- 避免JavaScript浮点数精度问题

### 错误处理
完整的错误处理机制：
- 交易失败自动重试
- 详细的错误日志
- 友好的错误提示

## 注意事项

1. 不要将私钥或环境配置文件上传到Git
2. 确保管理员钱包有足够的SOL支付gas费
3. 建议在测试网充分测试后再部署到主网
4. 定期备份钱包文件
5. 监控RPC节点响应状态

## 常见问题

1. **RPC限流问题**
   - 检查网络连接
   - 确认RPC节点状态
   - 适当增加重试间隔

2. **余额不足**
   - 确保有足够SOL支付gas费
   - 检查代币余额是否充足

3. **交易失败**
   - 检查网络连接
   - 确认收款地址正确
   - 查看详细错误日志

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m '添加新特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

 
## 下一步任务规划

### 1. 系统集成与API开发
- [ ] 创建RESTful API服务
- [ ] 实现转账队列系统
- [ ] 添加交易状态跟踪功能
- [ ] 开发管理员控制面板

### 2. 安全性增强
- [ ] 实现交易签名验证
- [ ] 添加转账限额控制
- [ ] 实现多重签名支持
- [ ] 开发异常监控和告警系统

### 3. 性能与可靠性优化
- [ ] 实现数据库持久化
- [ ] 添加缓存层减少RPC调用
- [ ] 开发自动重试和恢复机制
- [ ] 实现负载均衡和高可用性

### 4. 用户体验改进
- [ ] 开发前端界面
- [ ] 实现实时交易状态更新
- [ ] 添加交易历史记录查询
- [ ] 开发移动端支持

### 5. 测试与部署
- [ ] 编写单元测试和集成测试
- [ ] 设置CI/CD流程
- [ ] 准备生产环境部署文档