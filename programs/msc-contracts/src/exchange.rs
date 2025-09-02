use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::*;

// 兑换相关常量
const DEFAULT_EXCHANGE_RATE: u64 = 1_000_000; // 1 MSC = 1 USDC (1e6 precision)
const DEFAULT_FEE_RATE: u16 = 100; // 1% (100 basis points)
const MIN_SWAP_AMOUNT: u64 = 1_000_000; // 最小兑换量 1 MSC
const MAX_SWAP_AMOUNT: u64 = 1_000_000_000_000; // 最大兑换量 1M MSC

// MSC 兑换 USDC
pub fn swap_msc_to_usdc(
    ctx: Context<SwapMscToUsdc>,
    msc_amount: u64,
) -> Result<()> {
    let exchange_pool = &mut ctx.accounts.exchange_pool;
    
    // 验证兑换池状态
    require!(exchange_pool.is_active, MscError::ExchangePoolNotActive);
    require!(msc_amount >= MIN_SWAP_AMOUNT, MscError::SwapAmountTooSmall);
    require!(msc_amount <= MAX_SWAP_AMOUNT, MscError::SwapAmountTooLarge);
    
    // 验证用户MSC余额
    require!(
        ctx.accounts.user_msc_account.amount >= msc_amount,
        MscError::InsufficientBalance
    );
    
    // 计算兑换金额和手续费
    let exchange_rate = exchange_pool.exchange_rate;
    let fee_rate = exchange_pool.fee_rate;
    
    // USDC金额 = MSC金额 * 汇率 / 1e6
    let usdc_before_fee = msc_amount
        .checked_mul(exchange_rate)
        .ok_or(MscError::MathOverflow)?
        .checked_div(1_000_000)
        .ok_or(MscError::DivisionByZero)?;
    
    // 计算手续费
    let fee_amount = usdc_before_fee
        .checked_mul(fee_rate as u64)
        .ok_or(MscError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(MscError::DivisionByZero)?;
    
    let usdc_amount = usdc_before_fee
        .checked_sub(fee_amount)
        .ok_or(MscError::MathUnderflow)?;
    
    // 验证池子USDC余额
    require!(
        ctx.accounts.pool_usdc_vault.amount >= usdc_amount,
        MscError::InsufficientLiquidity
    );
    
    // 执行 MSC 转账到池子
    let cpi_accounts_msc = Transfer {
        from: ctx.accounts.user_msc_account.to_account_info(),
        to: ctx.accounts.pool_msc_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_msc = CpiContext::new(cpi_program.clone(), cpi_accounts_msc);
    
    token::transfer(cpi_ctx_msc, msc_amount)?;
    
    // 执行 USDC 转账给用户 (简化处理，实际需要池子作为权限)
    let cpi_accounts_usdc = Transfer {
        from: ctx.accounts.pool_usdc_vault.to_account_info(),
        to: ctx.accounts.user_usdc_account.to_account_info(),
        authority: ctx.accounts.pool_authority.to_account_info(),
    };
    let cpi_ctx_usdc = CpiContext::new(cpi_program, cpi_accounts_usdc);
    
    token::transfer(cpi_ctx_usdc, usdc_amount)?;
    
    // 记录兑换信息
    let swap_record = &mut ctx.accounts.swap_record;
    let clock = Clock::get()?;
    
    swap_record.user = ctx.accounts.user.key();
    swap_record.msc_amount = msc_amount;
    swap_record.usdc_amount = usdc_amount;
    swap_record.fee_amount = fee_amount;
    swap_record.exchange_rate = exchange_rate;
    swap_record.timestamp = clock.unix_timestamp;
    
    // 更新池子统计
    exchange_pool.total_volume = exchange_pool.total_volume
        .checked_add(msc_amount)
        .ok_or(MscError::MathOverflow)?;
    
    // 更新用户统计
    let user_stats = &mut ctx.accounts.user_stats;
    user_stats.user = ctx.accounts.user.key();
    user_stats.total_swaps = user_stats.total_swaps.checked_add(1).ok_or(MscError::MathOverflow)?;
    user_stats.last_activity = clock.unix_timestamp;
    
    msg!("Swap completed:");
    msg!("User: {}", ctx.accounts.user.key());
    msg!("MSC Amount: {}", msc_amount);
    msg!("USDC Amount: {}", usdc_amount);
    msg!("Fee Amount: {}", fee_amount);
    msg!("Exchange Rate: {}", exchange_rate);
    
    Ok(())
}

// 更新兑换汇率 (仅限管理员)
pub fn update_exchange_rate(
    ctx: Context<UpdateExchangeRate>,
    new_rate: u64,
) -> Result<()> {
    let exchange_pool = &mut ctx.accounts.exchange_pool;
    
    require!(
        ctx.accounts.authority.key() == exchange_pool.authority,
        MscError::InvalidAuthority
    );
    
    require!(new_rate > 0, MscError::InvalidExchangeRate);
    
    let old_rate = exchange_pool.exchange_rate;
    exchange_pool.exchange_rate = new_rate;
    
    msg!("Exchange rate updated:");
    msg!("Old Rate: {}", old_rate);
    msg!("New Rate: {}", new_rate);
    msg!("Updated by: {}", ctx.accounts.authority.key());
    
    Ok(())
}

// 初始化兑换池
pub fn initialize_exchange_pool(
    ctx: Context<InitializeExchangePool>,
) -> Result<()> {
    let exchange_pool = &mut ctx.accounts.exchange_pool;
    
    exchange_pool.authority = ctx.accounts.authority.key();
    exchange_pool.msc_mint = ctx.accounts.msc_mint.key();
    exchange_pool.usdc_mint = ctx.accounts.usdc_mint.key();
    exchange_pool.msc_vault = ctx.accounts.msc_vault.key();
    exchange_pool.usdc_vault = ctx.accounts.usdc_vault.key();
    exchange_pool.exchange_rate = DEFAULT_EXCHANGE_RATE;
    exchange_pool.fee_rate = DEFAULT_FEE_RATE;
    exchange_pool.total_volume = 0;
    exchange_pool.is_active = true;
    
    msg!("Exchange pool initialized:");
    msg!("Authority: {}", exchange_pool.authority);
    msg!("MSC Mint: {}", exchange_pool.msc_mint);
    msg!("USDC Mint: {}", exchange_pool.usdc_mint);
    msg!("Exchange Rate: {}", exchange_pool.exchange_rate);
    msg!("Fee Rate: {}%", exchange_pool.fee_rate as f64 / 100.0);
    
    Ok(())
}

// Account 结构定义

#[derive(Accounts)]
pub struct SwapMscToUsdc<'info> {
    #[account(mut)]
    pub exchange_pool: Account<'info, ExchangePool>,
    
    #[account(
        init,
        payer = user,
        space = SwapRecord::LEN
    )]
    pub swap_record: Account<'info, SwapRecord>,
    
    #[account(
        init,
        payer = user,
        space = UserStats::LEN
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub user_msc_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_msc_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_usdc_vault: Account<'info, TokenAccount>,
    
    /// CHECK: Pool authority for token transfers
    pub pool_authority: AccountInfo<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateExchangeRate<'info> {
    #[account(
        mut,
        seeds = [b"exchange_pool"],
        bump
    )]
    pub exchange_pool: Account<'info, ExchangePool>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeExchangePool<'info> {
    #[account(
        init,
        payer = authority,
        space = ExchangePool::LEN,
        seeds = [b"exchange_pool"],
        bump
    )]
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

// 辅助函数

// 计算兑换输出金额
pub fn calculate_swap_output(
    input_amount: u64,
    exchange_rate: u64,
    fee_rate: u16,
) -> Result<(u64, u64)> {
    let output_before_fee = input_amount
        .checked_mul(exchange_rate)
        .ok_or(MscError::MathOverflow)?
        .checked_div(1_000_000)
        .ok_or(MscError::DivisionByZero)?;
    
    let fee_amount = output_before_fee
        .checked_mul(fee_rate as u64)
        .ok_or(MscError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(MscError::DivisionByZero)?;
    
    let output_amount = output_before_fee
        .checked_sub(fee_amount)
        .ok_or(MscError::MathUnderflow)?;
    
    Ok((output_amount, fee_amount))
}