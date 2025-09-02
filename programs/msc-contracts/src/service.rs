use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::*;
use crate::ownership::validate_file_hash;
// use crate::ownership;

// 确权服务价格 (MSC tokens, 6 decimals)
const CLAIM_PRICE: u64 = 1_000_000;      // 1 MSC



// Account 结构定义

#[derive(Accounts)]
#[instruction(amount: u64, file_hash: String)]
pub struct PayAndCreateClaim<'info> {
    #[account(
        init,
        payer = user,
        space = PaymentRecord::LEN,
        seeds = [b"payment", user.key().as_ref(), file_hash.as_bytes()],
        bump
    )]
    pub payment_record: Account<'info, PaymentRecord>,
    
    #[account(
        init,
        payer = user,
        space = OwnershipClaim::LEN,
        seeds = [b"claim", user.key().as_ref(), file_hash.as_bytes()],
        bump
    )]
    pub claim: Account<'info, OwnershipClaim>,
    
    #[account(
        init,
        payer = user,
        space = UserStats::LEN,
        seeds = [b"user_stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}



// 获取确权服务价格
pub fn get_claim_price() -> u64 {
    CLAIM_PRICE
}

// Account 结构定义



// 辅助函数：验证支付金额
pub fn is_valid_payment_amount(amount: u64) -> bool {
    amount >= CLAIM_PRICE
}

// 辅助函数：获取服务名称
pub fn get_service_name() -> &'static str {
    "确权服务"
}

// 支付并创建确权记录（原子操作）
pub fn pay_and_create_claim(
    ctx: Context<PayAndCreateClaim>,
    amount: u64,
    file_hash: String,
) -> Result<()> {
    // 验证文件哈希
    require!(validate_file_hash(&file_hash), MscError::InvalidFileHash);
    
    // 验证支付金额
    require!(amount >= CLAIM_PRICE, MscError::PaymentAmountTooLow);
    require!(ctx.accounts.user_token_account.amount >= amount, MscError::InsufficientBalance);
    
    let clock = Clock::get()?;
    
    // 执行代币转账
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // 记录支付信息
    let payment_record = &mut ctx.accounts.payment_record;
    payment_record.payer = ctx.accounts.user.key();
    payment_record.amount = amount;
    payment_record.timestamp = clock.unix_timestamp;
    payment_record.transaction_id = ctx.accounts.user.key().to_string();
    payment_record.status = 1; // 已完成
    payment_record.is_used = true; // 标记为已使用
    
    // 创建确权记录
    let claim = &mut ctx.accounts.claim;
    claim.owner = ctx.accounts.user.key();
    claim.file_hash = file_hash.clone();
    claim.timestamp = clock.unix_timestamp;
    claim.transaction_id = ctx.accounts.user.key().to_string();
    claim.is_active = true;
    
    // 更新用户统计
    let user_stats = &mut ctx.accounts.user_stats;
    user_stats.user = ctx.accounts.user.key();
    user_stats.total_payments = user_stats.total_payments.checked_add(amount).ok_or(MscError::MathOverflow)?;
    user_stats.total_claims = user_stats.total_claims.checked_add(1).ok_or(MscError::MathOverflow)?;
    user_stats.last_activity = clock.unix_timestamp;
    
    msg!("Payment and claim creation completed:");
    msg!("User: {}", ctx.accounts.user.key());
    msg!("Amount: {} MSC", amount);
    msg!("File Hash: {}", file_hash);
    msg!("Timestamp: {}", clock.unix_timestamp);
    
    Ok(())
}