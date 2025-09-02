use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;



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