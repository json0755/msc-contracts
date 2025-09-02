use anchor_lang::prelude::*;

#[error_code]
pub enum MscError {
    #[msg("Token already initialized")]
    TokenAlreadyInitialized,
    
    #[msg("Insufficient token balance")]
    InsufficientBalance,
    
    #[msg("Invalid authority")]
    InvalidAuthority,
    
    #[msg("Invalid mint address")]
    InvalidMint,
    
    #[msg("File hash already exists")]
    FileHashExists,
    
    #[msg("Invalid file hash format")]
    InvalidFileHash,
    
    #[msg("Claim not found")]
    ClaimNotFound,
    
    #[msg("Claim already exists")]
    ClaimAlreadyExists,
    
    #[msg("Invalid service type")]
    InvalidServiceType,
    
    #[msg("Payment amount too low")]
    PaymentAmountTooLow,
    
    #[msg("Payment already processed")]
    PaymentAlreadyProcessed,
    
    #[msg("Exchange pool not active")]
    ExchangePoolNotActive,
    
    #[msg("Invalid exchange rate")]
    InvalidExchangeRate,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    
    #[msg("Swap amount too small")]
    SwapAmountTooSmall,
    
    #[msg("Swap amount too large")]
    SwapAmountTooLarge,
    
    #[msg("Oracle price feed error")]
    OraclePriceFeedError,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Math underflow")]
    MathUnderflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("Operation not allowed")]
    OperationNotAllowed,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    
    #[msg("Invalid recipient")]
    InvalidRecipient,
    
    #[msg("Airdrop limit exceeded")]
    AirdropLimitExceeded,
}