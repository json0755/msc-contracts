use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd");

// 导入各个模块
pub mod msc_token;
pub mod ownership;
pub mod service;
pub mod exchange;
pub mod state;
pub mod error;

use msc_token::*;
use ownership::*;
use service::*;
use exchange::*;
use state::*;
use error::*;

#[program]
pub mod msc_contracts {
    use super::*;

    // MSC Token 相关功能
    pub fn initialize_msc_token(
        ctx: Context<InitializeMscToken>,
        decimals: u8,
    ) -> Result<()> {
        msc_token::initialize_msc_token(ctx, decimals)
    }

    pub fn mint_msc(
        ctx: Context<MintMsc>,
        amount: u64,
    ) -> Result<()> {
        msc_token::mint_msc(ctx, amount)
    }

    pub fn transfer_msc(
        ctx: Context<TransferMsc>,
        amount: u64,
    ) -> Result<()> {
        msc_token::transfer_msc(ctx, amount)
    }

    pub fn batch_airdrop(
        ctx: Context<BatchAirdrop>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        msc_token::batch_airdrop(ctx, amounts)
    }

    // 支付并创建确权记录（原子操作）
    pub fn pay_and_create_claim(
        ctx: Context<PayAndCreateClaim>,
        amount: u64,
        file_hash: String,
    ) -> Result<()> {
        service::pay_and_create_claim(ctx, amount, file_hash)
    }

    // 兑换合约功能
    pub fn swap_msc_to_usdc(
        ctx: Context<SwapMscToUsdc>,
        msc_amount: u64,
    ) -> Result<()> {
        exchange::swap_msc_to_usdc(ctx, msc_amount)
    }

    pub fn update_exchange_rate(
        ctx: Context<UpdateExchangeRate>,
        new_rate: u64,
    ) -> Result<()> {
        exchange::update_exchange_rate(ctx, new_rate)
    }
}
