# MSC 合约接口文档

## 概述
MSC (Multi-Service Contract) 是一个基于 Solana 的多功能智能合约，提供代币管理、确权服务、支付服务和兑换功能。

**合约地址**: `F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd`

## 主要功能模块

### 1. MSC Token 管理

#### `initialize_msc_token(decimals: u8)`
- **功能**: 初始化 MSC 代币
- **参数**: 
  - `decimals`: 代币精度 (固定为 6)
- **权限**: 仅合约管理员
- **说明**: 创建总供应量为 1000万 MSC 的代币

#### `mint_msc(amount: u64)`
- **功能**: 铸造 MSC 代币
- **参数**: 
  - `amount`: 铸造数量 (6位小数精度)
- **权限**: 仅合约管理员

#### `transfer_msc(amount: u64)`
- **功能**: 转账 MSC 代币
- **参数**: 
  - `amount`: 转账数量
- **权限**: 代币持有者

#### `batch_airdrop(amounts: Vec<u64>)`
- **功能**: 批量空投代币
- **参数**: 
  - `amounts`: 空投数量数组 (最多10个)
- **权限**: 仅合约管理员

### 2. 确权服务

#### `pay_and_create_claim(amount: u64, file_hash: String)`
- **功能**: 原子操作：支付费用并创建确权记录
- **参数**: 
  - `amount`: 支付金额 (固定为 1 MSC)
  - `file_hash`: 文件SHA-256哈希值 (64位十六进制字符串)
- **权限**: MSC 代币持有者
- **费用**: 1 MSC
- **说明**: 确保先支付后确权的原子性操作

### 4. 代币兑换

#### `swap_msc_to_usdc(msc_amount: u64)`
- **功能**: MSC 兑换 USDC
- **参数**: 
  - `msc_amount`: MSC 兑换数量 (最小 1 MSC，最大 100万 MSC)
- **权限**: MSC 代币持有者
- **手续费**: 1% (可调整)
- **汇率**: 1 MSC = 1 USDC (可调整)

#### `update_exchange_rate(new_rate: u64)`
- **功能**: 更新兑换汇率
- **参数**: 
  - `new_rate`: 新汇率 (1e6 精度)
- **权限**: 仅合约管理员

## 数据结构

### MscTokenConfig
```rust
{
  authority: Pubkey,      // 管理员地址
  mint: Pubkey,          // 代币铸造地址
  total_supply: u64,     // 总供应量
  decimals: u8,          // 精度
  is_initialized: bool   // 初始化状态
}
```

### OwnershipClaim
```rust
{
  owner: Pubkey,         // 所有者地址
  file_hash: String,     // 文件哈希
  timestamp: i64,        // 创建时间戳
  transaction_id: String, // 交易ID
  is_active: bool        // 激活状态
}
```

### PaymentRecord
```rust
{
  payer: Pubkey,         // 支付者地址
  amount: u64,           // 支付金额
  timestamp: i64,        // 支付时间戳
  transaction_id: String, // 交易ID
  is_used: bool          // 是否已使用
}
```

### SwapRecord
```rust
{
  user: Pubkey,          // 用户地址
  msc_amount: u64,       // MSC 数量
  usdc_amount: u64,      // USDC 数量
  fee_amount: u64,       // 手续费
  exchange_rate: u64,    // 兑换汇率
  timestamp: i64         // 兑换时间戳
}
```

### UserStats
```rust
{
  user: Pubkey,          // 用户地址
  total_claims: u32,     // 总确权次数
  total_payments: u64,   // 总支付金额
  total_swaps: u32,      // 总兑换次数
  last_activity: i64     // 最后活动时间
}
```

## 常见错误码

| 错误码 | 说明 |
|--------|------|
| `TokenAlreadyInitialized` | 代币已初始化 |
| `InsufficientBalance` | 余额不足 |
| `InvalidAuthority` | 权限无效 |
| `InvalidFileHash` | 文件哈希格式无效 |
| `ClaimNotFound` | 确权记录未找到 |
| `InvalidServiceType` | 服务类型无效 |
| `PaymentAmountTooLow` | 支付金额过低 |
| `ExchangePoolNotActive` | 兑换池未激活 |
| `InsufficientLiquidity` | 流动性不足 |
| `SwapAmountTooSmall/TooLarge` | 兑换数量过小/过大 |
| `MathOverflow/MathUnderflow` | 数学运算溢出/下溢 |
| `DivisionByZero` | 除零错误 |
| `AccountNotInitialized` | 账户未初始化 |
| `InvalidAccountOwner` | 账户所有者无效 |
| `AirdropLimitExceeded` | 空投限制超出 |

## 前端集成指南

### 1. 环境配置
```javascript
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';

const PROGRAM_ID = new PublicKey('F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd');
const connection = new Connection('https://api.devnet.solana.com');
```

### 2. 钱包连接
```javascript
const { publicKey, signTransaction, connected } = useWallet();
```

### 3. 调用合约方法示例



#### 支付并创建确权记录
```javascript
const payAndCreateClaim = async (amount, fileHash) => {
  const tx = await program.methods
    .payAndCreateClaim(new BN(amount), fileHash)
    .accounts({
      paymentRecord: paymentRecordAccount,
      claim: claimAccount,
      userStats: userStatsAccount,
      userTokenAccount: userTokenAccount,
      treasuryTokenAccount: treasuryTokenAccount,
      user: publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
};
```

#### MSC 兑换 USDC
```javascript
const swapMscToUsdc = async (mscAmount) => {
  const tx = await program.methods
    .swapMscToUsdc(new BN(mscAmount))
    .accounts({
      exchangePool: exchangePoolAccount,
      swapRecord: swapRecordAccount,
      userStats: userStatsAccount,
      userMscAccount: userMscAccount,
      userUsdcAccount: userUsdcAccount,
      poolMscVault: poolMscVault,
      poolUsdcVault: poolUsdcVault,
      poolAuthority: poolAuthority,
      user: publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
};
```

### 4. 账户地址生成
```javascript
// 生成 PDA 地址
const [configAccount] = await PublicKey.findProgramAddress(
  [Buffer.from('msc_config')],
  PROGRAM_ID
);

const [exchangePoolAccount] = await PublicKey.findProgramAddress(
  [Buffer.from('exchange_pool')],
  PROGRAM_ID
);
```

## 注意事项

1. **精度处理**: 所有金额使用 6 位小数精度 (1 MSC = 1,000,000 基础单位)
2. **文件哈希**: 必须是 64 位十六进制字符串 (SHA-256)
3. **批量操作**: 限制为最多 10 个项目
4. **权限控制**: 部分功能需要管理员权限
5. **流动性**: 兑换功能需要足够的池子流动性
6. **错误处理**: 根据错误码提供用户友好的错误信息
7. **交易确认**: 监听交易确认状态更新 UI

## 测试网信息

- **网络**: Solana Devnet
- **RPC 端点**: `https://api.devnet.solana.com`
- **合约地址**: `F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd`
- **推荐钱包**: Phantom, Solflare

---

*文档版本: v1.0*  
*最后更新: 2024年*