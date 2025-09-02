import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { PROGRAM_ID, DEVNET_RPC_URL } from '../types';

// IDL类型定义（简化版）
export interface MscContractsIDL {
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
  types: any[];
}

// 程序工具类
export class MscProgramUtils {
  private connection: Connection;
  private program: anchor.Program | null = null;

  constructor(rpcUrl: string = DEVNET_RPC_URL) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  // 初始化程序
  async initializeProgram(wallet: any, idl?: MscContractsIDL): Promise<anchor.Provider> {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const provider = new anchor.AnchorProvider(
      this.connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    anchor.setProvider(provider);

    // 如果没有提供IDL，使用简化的程序接口
    if (idl) {
      this.program = new anchor.Program(idl, provider);
    }

    return provider;
  }

  // 获取配置PDA
  async getConfigPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('msc_config')],
      PROGRAM_ID
    );
  }

  // 获取声明PDA
  async getClaimPDA(user: PublicKey, fileHash: string): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('claim'), user.toBuffer(), Buffer.from(fileHash)],
      PROGRAM_ID
    );
  }

  // 获取用户统计PDA
  async getUserStatsPDA(user: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_stats'), user.toBuffer()],
      PROGRAM_ID
    );
  }

  // 获取支付记录PDA
  async getPaymentRecordPDA(user: PublicKey, timestamp: number): Promise<[PublicKey, number]> {
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp));
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('payment'), user.toBuffer(), timestampBuffer],
      PROGRAM_ID
    );
  }

  // 获取关联代币账户地址
  async getAssociatedTokenAccount(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    return await getAssociatedTokenAddress(mint, owner);
  }

  // 获取连接
  getConnection(): Connection {
    return this.connection;
  }

  // 获取程序
  getProgram(): anchor.Program | null {
    return this.program;
  }

  // 生成文件哈希（简化版）
  generateFileHash(data: string): string {
    // 在实际应用中，这里应该使用更安全的哈希算法
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(data);
    
    // 简单的哈希实现（仅用于演示）
    let hash = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const char = dataArray[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  // 格式化金额
  formatAmount(amount: anchor.BN, decimals: number = 6): string {
    const divisor = new anchor.BN(10).pow(new anchor.BN(decimals));
    const quotient = amount.div(divisor);
    const remainder = amount.mod(divisor);
    
    if (remainder.isZero()) {
      return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    return `${quotient.toString()}.${trimmedRemainder}`;
  }

  // 解析金额
  parseAmount(amount: string, decimals: number = 6): anchor.BN {
    const parts = amount.split('.');
    const wholePart = parts[0] || '0';
    const fractionalPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
    
    const wholeAmount = new anchor.BN(wholePart).mul(new anchor.BN(10).pow(new anchor.BN(decimals)));
    const fractionalAmount = new anchor.BN(fractionalPart);
    
    return wholeAmount.add(fractionalAmount);
  }
}

// 导出单例实例
export const mscProgramUtils = new MscProgramUtils();