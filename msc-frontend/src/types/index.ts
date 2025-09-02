import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// 合约相关类型
export interface MscTokenConfig {
  authority: PublicKey;
  mint: PublicKey;
  totalSupply: anchor.BN;
  decimals: number;
  isInitialized: boolean;
}

// 声明状态枚举
export enum ClaimStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected'
}

// 声明状态
export interface OwnershipClaim {
  owner: PublicKey;
  fileHash: string;
  fileName: string;
  description: string;
  timestamp: anchor.BN;
  transactionId: string;
  isActive: boolean;
  status: ClaimStatus;
  verifier?: PublicKey;
}

export interface PaymentRecord {
  payer: PublicKey;
  amount: anchor.BN;
  timestamp: anchor.BN;
  transactionId: string;
  status: number;
  isUsed: boolean;
}

export interface UserStats {
  user: PublicKey;
  totalClaims: number;
  totalPayments: anchor.BN;
  totalSwaps: number;
  lastActivity: anchor.BN;
}

export interface ExchangePool {
  authority: PublicKey;
  mscMint: PublicKey;
  usdcMint: PublicKey;
  mscVault: PublicKey;
  usdcVault: PublicKey;
  exchangeRate: anchor.BN;
  feeRate: number;
  totalVolume: anchor.BN;
  isActive: boolean;
}

export interface SwapRecord {
  user: PublicKey;
  mscAmount: anchor.BN;
  usdcAmount: anchor.BN;
  feeAmount: anchor.BN;
  exchangeRate: anchor.BN;
  timestamp: anchor.BN;
}

// UI相关类型
export interface AirdropRecipient {
  address: string;
  amount: number;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// 确权服务常量 - 统一价格 1 MSC
export const CLAIM_PRICE = 1_000_000; // 1 MSC (6 decimals)
export const CLAIM_SERVICE_NAME = '确权服务';
export const CLAIM_SERVICE_DESCRIPTION = '文件确权服务，用于声明文件所有权';

// 辅助函数
export const getClaimPrice = (): number => {
  return CLAIM_PRICE;
};

// 获取服务名称
export const getClaimServiceName = (): string => {
  return CLAIM_SERVICE_NAME;
};

// 获取服务描述
export const getClaimServiceDescription = (): string => {
  return CLAIM_SERVICE_DESCRIPTION;
};

// 验证支付金额
export const isValidPaymentAmount = (amount: number): boolean => {
  return amount >= CLAIM_PRICE;
};

// 辅助函数：格式化MSC金额显示
export const formatMscAmount = (amount: number): string => {
  return (amount / 1_000_000).toFixed(2);
};

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 0,
  COMPLETED = 1,
  REFUNDED = 2,
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed'
}

// 程序常量
export const PROGRAM_ID = new PublicKey('F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd');
export const MSC_TOKEN_DECIMALS = 6;
export const DEVNET_RPC_URL = 'https://api.devnet.solana.com';