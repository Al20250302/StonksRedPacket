export class TokenUtils {
  /**
   * 将代币数量转换为lamports（整数）
   * @param amount 代币数量
   * @param decimals 代币精度（默认为9）
   * @returns lamports数量
   */
  static toTokenAmount(amount: number, decimals: number = 9): bigint {
    // 使用BigInt避免浮点数精度问题
    const multiplier = BigInt(10) ** BigInt(decimals);
    const amountString = amount.toString();
    
    // 处理小数部分
    if (amountString.includes('.')) {
      const [integerPart, decimalPart] = amountString.split('.');
      const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
      return BigInt(integerPart) * multiplier + BigInt(paddedDecimal);
    }
    
    return BigInt(amountString) * multiplier;
  }
  
  /**
   * 将lamports（整数）转换为代币数量
   * @param lamports lamports数量
   * @param decimals 代币精度（默认为9）
   * @returns 代币数量
   */
  static fromTokenAmount(lamports: bigint | number, decimals: number = 9): number {
    const divisor = 10 ** decimals;
    const lamportsNumber = typeof lamports === 'bigint' ? Number(lamports) : lamports;
    return lamportsNumber / divisor;
  }
  
  /**
   * 格式化代币数量，避免显示科学计数法
   * @param amount 代币数量
   * @param decimals 显示的小数位数（默认为6）
   * @returns 格式化后的代币数量字符串
   */
  static formatTokenAmount(amount: number, decimals: number = 6): string {
    return amount.toFixed(decimals);
  }
  
  /**
   * 平均分配代币
   * @param totalAmount 总代币数量
   * @param parts 分配份数
   * @returns 每份的代币数量（整数lamports）
   */
  static distributeTokens(totalAmount: number, parts: number, tokenDecimals: number = 9): bigint {
    const totalLamports = this.toTokenAmount(totalAmount, tokenDecimals);
    return totalLamports / BigInt(parts);
  }
} 