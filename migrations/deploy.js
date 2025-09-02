// Deployment script for MSC Contracts
const anchor = require("@coral-xyz/anchor");
const { SystemProgram, Keypair, LAMPORTS_PER_SOL } = anchor.web3;
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token");

module.exports = async function (provider) {
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  
  const program = anchor.workspace.MscContracts;
  const connection = provider.connection;
  const wallet = provider.wallet;
  
  console.log("🚀 Starting MSC Contracts deployment...");
  console.log("📍 Program ID:", program.programId.toString());
  console.log("👤 Deployer:", wallet.publicKey.toString());
  
  try {
    // Step 1: Deploy and verify program
    console.log("\n📦 Step 1: Verifying program deployment...");
    const programInfo = await connection.getAccountInfo(program.programId);
    if (programInfo) {
      console.log("✅ Program successfully deployed");
      console.log("📊 Program data length:", programInfo.data.length);
    } else {
      throw new Error("❌ Program not found. Please run 'anchor deploy' first.");
    }
    
    // Step 2: Initialize MSC Token (if needed)
    console.log("\n🪙 Step 2: Setting up MSC Token...");
    
    // Find PDA for MSC token config
    const [mscConfigPda, mscConfigBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("msc_config")],
      program.programId
    );
    
    console.log("🔑 MSC Config PDA:", mscConfigPda.toString());
    
    // Check if MSC token is already initialized
    try {
      const configAccount = await program.account.mscTokenConfig.fetch(mscConfigPda);
      console.log("✅ MSC Token already initialized");
      console.log("🏦 Authority:", configAccount.authority.toString());
      console.log("🪙 Mint:", configAccount.mint.toString());
      console.log("💰 Total Supply:", configAccount.totalSupply.toString());
      console.log("🔢 Decimals:", configAccount.decimals);
    } catch (error) {
      console.log("⚠️  MSC Token not initialized yet");
      console.log("💡 To initialize MSC Token, run the initialization script separately");
      console.log("💡 Or use the frontend application to initialize");
    }
    
    // Step 3: Setup Exchange Pool (if needed)
    console.log("\n🔄 Step 3: Setting up Exchange Pool...");
    
    const [exchangePoolPda, exchangePoolBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("exchange_pool")],
      program.programId
    );
    
    console.log("🔑 Exchange Pool PDA:", exchangePoolPda.toString());
    
    try {
      const exchangePoolAccount = await program.account.exchangePool.fetch(exchangePoolPda);
      console.log("✅ Exchange Pool already initialized");
      console.log("🏦 Authority:", exchangePoolAccount.authority.toString());
      console.log("💱 Exchange Rate:", exchangePoolAccount.exchangeRate.toString());
      console.log("💸 Fee Rate:", exchangePoolAccount.feeRate, "basis points");
      console.log("📊 Total Volume:", exchangePoolAccount.totalVolume.toString());
      console.log("🟢 Active:", exchangePoolAccount.isActive);
    } catch (error) {
      console.log("⚠️  Exchange Pool not initialized yet");
      console.log("💡 To initialize Exchange Pool, run the initialization script separately");
    }
    
    // Step 4: Display important addresses and next steps
    console.log("\n📋 Deployment Summary:");
    console.log("=".repeat(50));
    console.log("🏗️  Program ID:", program.programId.toString());
    console.log("🔑 MSC Config PDA:", mscConfigPda.toString());
    console.log("🔑 Exchange Pool PDA:", exchangePoolPda.toString());
    console.log("👤 Deployer:", wallet.publicKey.toString());
    console.log("🌐 Network:", connection.rpcEndpoint);
    
    console.log("\n📝 Next Steps:");
    console.log("1. Initialize MSC Token (if not done)");
    console.log("2. Initialize Exchange Pool (if not done)");
    console.log("3. Set up frontend application");
    console.log("4. Configure Chainlink price feeds (for mainnet)");
    console.log("5. Add liquidity to exchange pool");
    
    console.log("\n🎉 Deployment completed successfully!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
};

// Helper function to initialize MSC Token (can be called separately)
async function initializeMscToken(program, authority) {
  console.log("🪙 Initializing MSC Token...");
  
  // This would need to be implemented with proper mint creation
  // and token account setup. Left as a template for actual deployment.
  
  console.log("💡 MSC Token initialization requires:");
  console.log("   - Create mint account");
  console.log("   - Create authority token account");
  console.log("   - Call initializeMscToken instruction");
  console.log("   - Mint initial supply to authority");
}

// Helper function to initialize Exchange Pool (can be called separately)
async function initializeExchangePool(program, authority, mscMint, usdcMint) {
  console.log("🔄 Initializing Exchange Pool...");
  
  // This would need to be implemented with proper vault creation
  // and pool setup. Left as a template for actual deployment.
  
  console.log("💡 Exchange Pool initialization requires:");
  console.log("   - Create MSC vault account");
  console.log("   - Create USDC vault account");
  console.log("   - Call initializeExchangePool instruction");
  console.log("   - Set initial exchange rate and fee rate");
}

// Export helper functions for separate use
module.exports.initializeMscToken = initializeMscToken;
module.exports.initializeExchangePool = initializeExchangePool;
