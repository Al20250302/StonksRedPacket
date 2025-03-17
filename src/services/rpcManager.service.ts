import * as web3 from '@solana/web3.js';

export class RpcManager {
  private rpcEndpoints: string[] = [
    web3.clusterApiUrl('mainnet-beta'),
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
  ];
  
  private currentEndpointIndex: number = 0;
  
  // 获取当前RPC端点
  getCurrentEndpoint(): string {
    return this.rpcEndpoints[this.currentEndpointIndex];
  }
  
  // 切换到下一个RPC端点
  switchToNextEndpoint(): string {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length;
    return this.getCurrentEndpoint();
  }
  
  // 创建连接
  createConnection(options?: web3.ConnectionConfig): web3.Connection {
    return new web3.Connection(this.getCurrentEndpoint(), options);
  }
  
  // 处理429错误并重试
  async executeWithRetry<T>(
    operation: (connection: web3.Connection) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let retries = 0;
    let lastError: any;
    
    while (retries <= maxRetries) {
      try {
        const connection = this.createConnection({
          commitment: 'confirmed' as web3.Commitment,
          confirmTransactionInitialTimeout: 60000,
        });
        
        return await operation(connection);
      } catch (error: any) {
        lastError = error;
        
        // 检查是否是429错误
        if (error.toString().includes('429') || error.toString().includes('Too Many Requests')) {
          console.log(`遇到API限流，切换到下一个RPC端点并重试...`);
          this.switchToNextEndpoint();
          retries++;
          
          if (retries <= maxRetries) {
            const delay = Math.pow(2, retries) * 500; // 指数退避
            console.log(`等待 ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else {
          // 其他错误直接抛出
          throw error;
        }
      }
    }
    
    throw lastError || new Error('超过最大重试次数');
  }
} 