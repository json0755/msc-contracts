use anchor_lang::prelude::*;

// MSC Token 配置
#[account]
pub struct MscTokenConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub decimals: u8,
    pub is_initialized: bool,
}

impl MscTokenConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 1;
}

// 确权记录
#[account]
pub struct OwnershipClaim {
    pub owner: Pubkey,
    pub file_hash: String,
    pub timestamp: i64,
    pub transaction_id: String,
    pub is_active: bool,
}

impl OwnershipClaim {
    pub const LEN: usize = 8 + 32 + 4 + 64 + 8 + 4 + 64 + 1; // 预留64字节给字符串
}

// 服务支付记录
#[account]
pub struct PaymentRecord {
    pub payer: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub transaction_id: String,
    pub status: u8, // 0: 待处理, 1: 已完成, 2: 已退款
    pub is_used: bool, // 防止重复使用付费记录
}

impl PaymentRecord {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 4 + 64 + 1 + 1;
}



// 兑换池配置
#[account]
pub struct ExchangePool {
    pub authority: Pubkey,
    pub msc_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub msc_vault: Pubkey,
    pub usdc_vault: Pubkey,
    pub exchange_rate: u64, // MSC/USDC 汇率 (乘以 1e6)
    pub fee_rate: u16, // 手续费率 (基点，如100表示1%)
    pub total_volume: u64,
    pub is_active: bool,
}

impl ExchangePool {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 8 + 2 + 8 + 1;
}

// 兑换记录
#[account]
pub struct SwapRecord {
    pub user: Pubkey,
    pub msc_amount: u64,
    pub usdc_amount: u64,
    pub fee_amount: u64,
    pub exchange_rate: u64,
    pub timestamp: i64,
}

impl SwapRecord {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 8;
}

// 用户统计信息
#[account]
pub struct UserStats {
    pub user: Pubkey,
    pub total_claims: u32,
    pub total_payments: u64,
    pub total_swaps: u32,
    pub last_activity: i64,
}

impl UserStats {
    pub const LEN: usize = 8 + 32 + 4 + 8 + 4 + 8;
}