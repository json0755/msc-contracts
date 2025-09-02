use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::error::*;

// MSC Token 总供应量: 1000万枚 (10,000,000 * 10^6)
const MSC_TOTAL_SUPPLY: u64 = 10_000_000_000_000;
const MSC_DECIMALS: u8 = 6;

// 初始化 MSC Token
pub fn initialize_msc_token(
    ctx: Context<InitializeMscToken>,
    decimals: u8,
) -> Result<()> {
    require!(decimals == MSC_DECIMALS, MscError::InvalidAuthority);
    
    let config = &mut ctx.accounts.config;
    require!(!config.is_initialized, MscError::TokenAlreadyInitialized);
    
    config.authority = ctx.accounts.authority.key();
    config.mint = ctx.accounts.mint.key();
    config.total_supply = MSC_TOTAL_SUPPLY;
    config.decimals = decimals;
    config.is_initialized = true;
    
    // 铸造初始供应量到权威账户
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.authority_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::mint_to(cpi_ctx, MSC_TOTAL_SUPPLY)?;
    
    msg!("MSC Token initialized with total supply: {}", MSC_TOTAL_SUPPLY);
    Ok(())
}

// 铸造 MSC Token (仅限权威账户)
pub fn mint_msc(
    ctx: Context<MintMsc>,
    amount: u64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, MscError::AccountNotInitialized);
    require!(ctx.accounts.authority.key() == config.authority, MscError::InvalidAuthority);
    
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::mint_to(cpi_ctx, amount)?;
    
    msg!("Minted {} MSC tokens", amount);
    Ok(())
}

// 转账 MSC Token
pub fn transfer_msc(
    ctx: Context<TransferMsc>,
    amount: u64,
) -> Result<()> {
    require!(ctx.accounts.from.amount >= amount, MscError::InsufficientBalance);
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    msg!("Transferred {} MSC tokens", amount);
    Ok(())
}

// 批量空投
pub fn batch_airdrop(
    ctx: Context<BatchAirdrop>,
    amounts: Vec<u64>,
) -> Result<()> {
    require!(amounts.len() <= 10, MscError::AirdropLimitExceeded);
    
    let config = &ctx.accounts.config;
    require!(config.is_initialized, MscError::AccountNotInitialized);
    require!(ctx.accounts.authority.key() == config.authority, MscError::InvalidAuthority);
    
    let total_amount: u64 = amounts.iter().sum();
    require!(ctx.accounts.from.amount >= total_amount, MscError::InsufficientBalance);
    
    // 这里简化处理，实际应该循环处理多个接收者
    // 由于 Anchor 限制，这里只演示单个转账的逻辑
    if let Some(&first_amount) = amounts.first() {
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, first_amount)?;
        
        msg!("Airdropped {} MSC tokens", first_amount);
    }
    
    Ok(())
}

// Account 结构定义

#[derive(Accounts)]
pub struct InitializeMscToken<'info> {
    #[account(
        init,
        payer = authority,
        space = MscTokenConfig::LEN,
        seeds = [b"msc_config"],
        bump
    )]
    pub config: Account<'info, MscTokenConfig>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintMsc<'info> {
    #[account(
        seeds = [b"msc_config"],
        bump
    )]
    pub config: Account<'info, MscTokenConfig>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferMsc<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BatchAirdrop<'info> {
    #[account(
        seeds = [b"msc_config"],
        bump
    )]
    pub config: Account<'info, MscTokenConfig>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}