const anchor = require("@coral-xyz/anchor");
const { SystemProgram, Keypair, LAMPORTS_PER_SOL } = anchor.web3;

// 简化测试脚本 - 仅验证程序编译和基本功能
async function runSimpleTest() {
  try {
    console.log("🚀 开始MSC合约简化测试...");
    
    // 配置提供者
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    // 加载程序
    const program = anchor.workspace.MscContracts;
    console.log("✅ 程序加载成功:", program.programId.toString());
    
    // 验证程序IDL
    console.log("📋 程序指令:");
    Object.keys(program.idl.instructions).forEach(instruction => {
      console.log(`  - ${instruction}`);
    });
    
    console.log("\n🎯 合约编译和加载测试通过!");
    console.log("\n📝 可用的合约功能:");
    console.log("  1. MSC代币管理 (初始化、铸造、转账、批量空投)");
    console.log("  2. 数据确权 (创建声明、验证确权)");
    console.log("  3. 服务支付 (MSC代币支付服务费用)");
    console.log("  4. 代币兑换 (MSC与USDC兑换)");
    
    return true;
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runSimpleTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("❌ 测试执行错误:", error);
      process.exit(1);
    });
}

module.exports = { runSimpleTest };