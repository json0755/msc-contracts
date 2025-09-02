use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::*;
// use crate::ownership;

// 服务类型定义
const SERVICE_BASIC_CLAIM: u8 = 0;     // 基础确权服务
const SERVICE_PREMIUM_CLAIM: u8 = 1;   // 高级确权服务
const SERVICE_BULK_CLAIM: u8 = 2;      // 批量确权服务

// 服务价格 (MSC tokens, 6 decimals)
const BASIC_CLAIM_PRICE: u64 = 10_000_000;      // 10 MSC
const PREMIUM_CLAIM_PRICE: u64 = 50_000_000;    // 50 MSC
const BULK_CLAIM_PRICE: u64 = 100_000_000;      // 100 MSC

// 使用 MSC 支付服务
pub fn pay_with_msc(
    ctx: Context<PayWithMsc>,
    amount: u64,
    service_type: u8,
) -> Result<()> {
    // 验证服务类型
    require!(
        service_type <= SERVICE_BULK_CLAIM,
        MscError::InvalidServiceType
    );
    
    // 验证支付金额
    let required_amount = match service_type {
        SERVICE_BASIC_CLAIM => BASIC_CLAIM_PRICE,
        SERVICE_PREMIUM_CLAIM => PREMIUM_CLAIM_PRICE,
        SERVICE_BULK_CLAIM => BULK_CLAIM_PRICE,
        _ => return Err(MscError::InvalidServiceType.into()),
    };
    
    require!(amount >= required_amount, MscError::PaymentAmountTooLow);
    require!(ctx.accounts.user_token_account.amount >= amount, MscError::InsufficientBalance);
    
    // 执行代币转账到服务账户
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.service_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    // 记录支付信息
    let payment_record = &mut ctx.accounts.payment_record;
    let clock = Clock::get()?;
    
    payment_record.payer = ctx.accounts.user.key();
    payment_record.amount = amount;
    payment_record.service_type = service_type;
    payment_record.timestamp = clock.unix_timestamp;
    payment_record.transaction_id = ctx.accounts.user.key().to_string(); // 简化处理
    payment_record.status = 1; // 已完成
    
    // 更新用户统计
    let user_stats = &mut ctx.accounts.user_stats;
    user_stats.user = ctx.accounts.user.key();
    user_stats.total_payments = user_stats.total_payments.checked_add(amount).ok_or(MscError::MathOverflow)?;
    user_stats.last_activity = clock.unix_timestamp;
    
    msg!("Payment successful:");
    msg!("User: {}", ctx.accounts.user.key());
    msg!("Amount: {} MSC", amount);
    msg!("Service Type: {}", service_type);
    msg!("Timestamp: {}", clock.unix_timestamp);
    
    // 如果是确权服务，自动触发确权流程
    if service_type == SERVICE_BASIC_CLAIM || service_type == SERVICE_PREMIUM_CLAIM {
        msg!("Service payment completed. Ready for claim creation.");
    }
    
    Ok(())
}

// 查询支付历史
pub fn get_payment_history(
    ctx: Context<GetPaymentHistory>,
) -> Result<()> {
    let payment_record = &ctx.accounts.payment_record;
    let user_stats = &ctx.accounts.user_stats;
    
    require!(payment_record.payer == ctx.accounts.user.key(), MscError::InvalidAccountOwner);
    
    msg!("Payment History:");
    msg!("Payer: {}", payment_record.payer);
    msg!("Amount: {} MSC", payment_record.amount);
    msg!("Service Type: {}", payment_record.service_type);
    msg!("Timestamp: {}", payment_record.timestamp);
    msg!("Status: {}", payment_record.status);
    msg!("Total Payments: {} MSC", user_stats.total_payments);
    
    Ok(())
}

// 获取服务价格
pub fn get_service_price(service_type: u8) -> Result<u64> {
    match service_type {
        SERVICE_BASIC_CLAIM => Ok(BASIC_CLAIM_PRICE),
        SERVICE_PREMIUM_CLAIM => Ok(PREMIUM_CLAIM_PRICE),
        SERVICE_BULK_CLAIM => Ok(BULK_CLAIM_PRICE),
        _ => Err(MscError::InvalidServiceType.into()),
    }
}

// Account 结构定义

#[derive(Accounts)]
pub struct PayWithMsc<'info> {
    #[account(
        init,
        payer = user,
        space = PaymentRecord::LEN
    )]
    pub payment_record: Account<'info, PaymentRecord>,
    
    #[account(
        init,
        payer = user,
        space = UserStats::LEN
    )]
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

#[derive(Accounts)]
pub struct GetPaymentHistory<'info> {
    pub payment_record: Account<'info, PaymentRecord>,
    pub user_stats: Account<'info, UserStats>,
    pub user: Signer<'info>,
}

// 辅助函数：验证服务类型
pub fn is_valid_service_type(service_type: u8) -> bool {
    service_type <= SERVICE_BULK_CLAIM
}

// 辅助函数：获取服务名称
pub fn get_service_name(service_type: u8) -> &'static str {
    match service_type {
        SERVICE_BASIC_CLAIM => "Basic Claim",
        SERVICE_PREMIUM_CLAIM => "Premium Claim",
        SERVICE_BULK_CLAIM => "Bulk Claim",
        _ => "Unknown Service",
    }
}