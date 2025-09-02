use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

// 创建确权记录
pub fn create_claim(
    ctx: Context<CreateClaim>,
    file_hash: String,
) -> Result<()> {
    require!(file_hash.len() == 64, MscError::InvalidFileHash); // SHA-256 哈希长度
    require!(file_hash.chars().all(|c| c.is_ascii_hexdigit()), MscError::InvalidFileHash);
    
    let claim = &mut ctx.accounts.claim;
    let clock = Clock::get()?;
    
    claim.owner = ctx.accounts.owner.key();
    claim.file_hash = file_hash.clone();
    claim.timestamp = clock.unix_timestamp;
    claim.transaction_id = ctx.accounts.owner.key().to_string(); // 简化处理，实际应该是交易签名
    claim.is_active = true;
    
    // 更新用户统计
    let user_stats = &mut ctx.accounts.user_stats;
    user_stats.user = ctx.accounts.owner.key();
    user_stats.total_claims = user_stats.total_claims.checked_add(1).ok_or(MscError::MathOverflow)?;
    user_stats.last_activity = clock.unix_timestamp;
    
    msg!("Created ownership claim for file hash: {}", file_hash);
    msg!("Owner: {}", ctx.accounts.owner.key());
    msg!("Timestamp: {}", clock.unix_timestamp);
    
    Ok(())
}

// 查询确权记录
pub fn get_claim(
    ctx: Context<GetClaim>,
) -> Result<()> {
    let claim = &ctx.accounts.claim;
    
    require!(claim.is_active, MscError::ClaimNotFound);
    require!(claim.owner == ctx.accounts.owner.key(), MscError::InvalidAccountOwner);
    
    msg!("Claim found:");
    msg!("Owner: {}", claim.owner);
    msg!("File Hash: {}", claim.file_hash);
    msg!("Timestamp: {}", claim.timestamp);
    msg!("Transaction ID: {}", claim.transaction_id);
    msg!("Status: Active");
    
    Ok(())
}

// Account 结构定义

#[derive(Accounts)]
#[instruction(file_hash: String)]
pub struct CreateClaim<'info> {
    #[account(
        init,
        payer = owner,
        space = OwnershipClaim::LEN
    )]
    pub claim: Account<'info, OwnershipClaim>,
    
    #[account(
        init,
        payer = owner,
        space = UserStats::LEN
    )]
    pub user_stats: Account<'info, UserStats>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetClaim<'info> {
    pub claim: Account<'info, OwnershipClaim>,
    pub owner: Signer<'info>,
}

// 辅助函数：验证文件哈希格式
pub fn validate_file_hash(hash: &str) -> bool {
    hash.len() == 64 && hash.chars().all(|c| c.is_ascii_hexdigit())
}

// 辅助函数：生成交易ID
pub fn generate_transaction_id(owner: &Pubkey, timestamp: i64) -> String {
    format!("{}-{}", owner.to_string()[..8].to_string(), timestamp)
}