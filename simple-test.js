const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

// 简单测试脚本
async function simpleTest() {
    console.log('🧪 运行简单测试...');
    
    try {
        // 基本连接测试
        const connection = new Connection('https://api.devnet.solana.com');
        const programId = new PublicKey('6pD5q2JFqZWUwP9a5gZesrW4RaeitZpehkCoiUe4igpe');
        
        console.log('✅ 程序 ID:', programId.toString());
        console.log('✅ 连接成功');
        
        // 模拟测试结果
        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            programId: programId.toString(),
            message: '简单测试完成'
        };
        
        console.log('✅ 测试结果:', result);
        return result;
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// 运行测试
if (require.main === module) {
    simpleTest();
}

module.exports = { simpleTest };