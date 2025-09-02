# MSC Contracts API 文档

## 概述

本文档详细描述了MSC Contracts智能合约系统的所有API接口，包括参数说明、返回值和使用示例。

## 程序ID

- **开发环境**: `6TnYnENiGmLiVQFHp29wbMtmVrLJhwFRn7EMqsipvkn5`
- **生产环境**: 待部署后更新

---

## 1. MSC代币管理模块

### 1.1 初始化MSC代币

**指令**: `initialize_msc_token`

**描述**: 初始化MSC代币配置，设置总供应量和权限

**账户结构**:
```rust
pub struct InitializeMscToken<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8)]
    pub msc_token_config: Account<'info, MscTokenConfig>,
    pub mint: Account<'info, Mint>,
    pub authority_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

**参数**:
- `total_supply`: u64 - 总供应量（默认10,000,000 * 10^6）

**使用示例**:
```javascript
const tx = await program.methods
  .initializeMscToken(new anchor.BN(10_000_000_000_000))
  .accounts({
    mscTokenConfig: configPda,
    mint: mscMint,
    authorityTokenAccount: authorityTokenAccount,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

### 1.2 铸造MSC代币

**指令**: `mint_msc`

**描述**: 铸造指定数量的MSC代币到目标账户

**账户结构**:
```rust
pub struct MintMsc<'info> {
    #[account(mut)]
    pub msc_token_config: Account<'info, MscTokenConfig>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

**参数**:
- `amount`: u64 - 铸造数量

**使用示例**:
```javascript
const tx = await program.methods
  .mintMsc(new anchor.BN(1000000))
  .accounts({
    mscTokenConfig: configPda,
    mint: mscMint,
    to: userTokenAccount,
    authority: authority.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([authority])
  .rpc();
```

### 1.3 转账MSC代币

**指令**: `transfer_msc`

**描述**: 在两个账户之间转移MSC代币

**账户结构**:
```rust
pub struct TransferMsc<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

**参数**:
- `amount`: u64 - 转账数量

**使用示例**:
```javascript
const tx = await program.methods
  .transferMsc(new anchor.BN(500000))
  .accounts({
    from: senderTokenAccount,
    to: receiverTokenAccount,
    authority: sender.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([sender])
  .rpc();
```

### 1.4 批量空投

**指令**: `batch_airdrop`

**描述**: 批量向多个账户空投MSC代币

**账户结构**:
```rust
pub struct BatchAirdrop<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
```

**参数**:
- `amount`: u64 - 每个账户的空投数量

---

## 2. 数据确权模块

### 2.1 创建确权声明

**指令**: `create_claim`

**描述**: 为数据创建所有权声明

**账户结构**:
```rust
pub struct CreateClaim<'info> {
    #[account(init, payer = user, space = 8 + 32 + 32 + 200 + 8)]
    pub ownership_claim: Account<'info, OwnershipClaim>,
    #[account(init, payer = user, space = 8 + 32 + 8 + 8)]
    pub user_stats: Account<'info, UserStats>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

**参数**:
- `data_hash`: [u8; 32] - 数据哈希值
- `metadata`: String - 元数据信息

**使用示例**:
```javascript
const dataHash = Array.from(crypto.randomBytes(32));
const tx = await program.methods
  .createClaim(dataHash, "数据描述信息")
  .accounts({
    ownershipClaim: claimPda,
    userStats: userStatsPda,
    user: user.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([user])
  .rpc();
```

### 2.2 验证确权

**指令**: `verify_ownership`

**描述**: 验证数据的所有权声明

**账户结构**:
```rust
pub struct VerifyOwnership<'info> {
    #[account(mut)]
    pub ownership_claim: Account<'info, OwnershipClaim>,
    pub user: Signer<'info>,
}
```

**参数**: 无

**使用示例**:
```javascript
const tx = await program.methods
  .verifyOwnership()
  .accounts({
    ownershipClaim: claimPda,
    user: user.publicKey,
  })
  .signers([user])
  .rpc();
```

---

## 3. 服务支付模块

### 3.1 MSC代币支付

**指令**: `pay_with_msc`

**描述**: 使用MSC代币支付服务费用

**账户结构**:
```rust
pub struct PayWithMsc<'info> {
    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 8)]
    pub payment_record: Account<'info, PaymentRecord>,
    #[account(init, payer = user, space = 8 + 32 + 8 + 8)]
    pub user_stats: Account<'info, UserStats>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub service_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

**参数**:
- `service_id`: String - 服务标识符
- `amount`: u64 - 支付金额

**使用示例**:
```javascript
const tx = await program.methods
  .payWithMsc("data_storage_service", new anchor.BN(100000))
  .accounts({
    paymentRecord: paymentPda,
    userStats: userStatsPda,
    userTokenAccount: userTokenAccount,
    serviceTokenAccount: serviceTokenAccount,
    user: user.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([user])
  .rpc();
```

---

## 4. 代币兑换模块

### 4.1 初始化兑换池

**指令**: `initialize_exchange_pool`

**描述**: 初始化MSC/USDC兑换池

**账户结构**:
```rust
pub struct InitializeExchangePool<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8 + 8)]
    pub exchange_pool: Account<'info, ExchangePool>,
    pub msc_mint: Account<'info, anchor_spl::token::Mint>,
    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub msc_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub usdc_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

**参数**:
- `initial_msc_amount`: u64 - 初始MSC流动性
- `initial_usdc_amount`: u64 - 初始USDC流动性

**使用示例**:
```javascript
const tx = await program.methods
  .initializeExchangePool(
    new anchor.BN(1000000000), // 1000 MSC
    new anchor.BN(100000000)   // 100 USDC
  )
  .accounts({
    exchangePool: poolPda,
    mscMint: mscMint,
    usdcMint: usdcMint,
    mscVault: mscVault,
    usdcVault: usdcVault,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

### 4.2 MSC兑换USDC

**指令**: `swap_msc_to_usdc`

**描述**: 将MSC代币兑换为USDC

**账户结构**:
```rust
pub struct SwapMscToUsdc<'info> {
    #[account(mut)]
    pub exchange_pool: Account<'info, ExchangePool>,
    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 8 + 8)]
    pub swap_record: Account<'info, SwapRecord>,
    #[account(init, payer = user, space = 8 + 32 + 8 + 8)]
    pub user_stats: Account<'info, UserStats>,
    #[account(mut)]
    pub user_msc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_msc_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_usdc_vault: Account<'info, TokenAccount>,
    /// CHECK: Pool authority PDA
    pub pool_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

**参数**:
- `msc_amount`: u64 - 要兑换的MSC数量

**使用示例**:
```javascript
const tx = await program.methods
  .swapMscToUsdc(new anchor.BN(1000000)) // 1 MSC
  .accounts({
    exchangePool: poolPda,
    swapRecord: swapRecordPda,
    userStats: userStatsPda,
    userMscAccount: userMscAccount,
    userUsdcAccount: userUsdcAccount,
    poolMscVault: poolMscVault,
    poolUsdcVault: poolUsdcVault,
    poolAuthority: poolAuthorityPda,
    user: user.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([user])
  .rpc();
```

---

## 数据结构

### MscTokenConfig
```rust
pub struct MscTokenConfig {
    pub authority: Pubkey,
    pub total_supply: u64,
}
```

### OwnershipClaim
```rust
pub struct OwnershipClaim {
    pub owner: Pubkey,
    pub data_hash: [u8; 32],
    pub metadata: String,
    pub timestamp: i64,
}
```

### PaymentRecord
```rust
pub struct PaymentRecord {
    pub user: Pubkey,
    pub service_id: String,
    pub amount: u64,
    pub timestamp: i64,
}
```

### ExchangePool
```rust
pub struct ExchangePool {
    pub authority: Pubkey,
    pub msc_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub msc_vault: Pubkey,
    pub usdc_vault: Pubkey,
    pub msc_reserve: u64,
    pub usdc_reserve: u64,
}
```

### SwapRecord
```rust
pub struct SwapRecord {
    pub user: Pubkey,
    pub msc_amount: u64,
    pub usdc_amount: u64,
    pub timestamp: i64,
}
```

### UserStats
```rust
pub struct UserStats {
    pub user: Pubkey,
    pub total_claims: u64,
    pub total_payments: u64,
}
```

---

## 错误代码

| 代码 | 名称 | 描述 |
|------|------|------|
| 6000 | InsufficientBalance | 余额不足 |
| 6001 | InvalidAmount | 无效金额 |
| 6002 | UnauthorizedAccess | 未授权访问 |
| 6003 | InvalidDataHash | 无效数据哈希 |
| 6004 | ClaimAlreadyExists | 声明已存在 |
| 6005 | InsufficientLiquidity | 流动性不足 |
| 6006 | InvalidSwapAmount | 无效兑换金额 |

---

## 注意事项

1. **权限管理**: 确保只有授权用户才能执行敏感操作
2. **余额检查**: 所有涉及代币转移的操作都会进行余额验证
3. **数据完整性**: 所有数据哈希都应该是有效的32字节数组
4. **流动性管理**: 兑换操作需要确保池中有足够的流动性
5. **费用计算**: 兑换操作可能包含手续费，请参考具体实现

---

## 版本信息

- **当前版本**: v1.0.0
- **Anchor版本**: 0.31.1
- **Solana版本**: 1.18+

---

更多信息请参考项目README文档或联系开发团队。