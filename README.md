# MSC Contracts - 多功能智能合约系统

## 项目概述

MSC Contracts是一个基于Solana区块链的多功能智能合约系统，集成了代币管理、数据确权、服务支付和代币兑换等核心功能。该系统使用Anchor框架开发，提供安全、高效的去中心化解决方案。

## 核心功能

### 1. MSC代币管理 (msc_token.rs)
- **代币初始化**: 创建MSC代币，总供应量1000万枚
- **代币铸造**: 授权用户铸造新的MSC代币
- **代币转账**: 安全的点对点代币转移
- **批量空投**: 高效的批量代币分发功能

### 2. 数据确权与支付系统 (ownership.rs & service.rs)
- **原子操作**: 支付与确权的原子性操作 (统一价格1 MSC)
- **确权验证**: 验证数据所有权的真实性
- **支付记录**: 完整的支付历史追踪
- **用户统计**: 跟踪用户的确权和支付活动
- **余额验证**: 确保支付安全性

### 3. 代币兑换系统 (exchange.rs)
- **MSC/USDC兑换**: 支持MSC与USDC之间的兑换
- **流动性池**: 去中心化的流动性管理
- **价格发现**: 基于供需的动态定价机制
- **兑换记录**: 完整的交易历史

## 技术架构

### 依赖项
- **Anchor Framework**: v0.31.1
- **Solana Program Library**: 最新版本
- **Rust**: 1.75.0+

### 项目结构
```
msc-contracts/
├── programs/msc-contracts/src/
│   ├── lib.rs              # 主程序入口
│   ├── msc_token.rs        # MSC代币管理
│   ├── ownership.rs        # 数据确权
│   ├── service.rs          # 支付与确权原子操作
│   └── exchange.rs         # 代币兑换
├── tests/                  # 测试文件
├── migrations/             # 部署脚本
└── target/                 # 编译输出
```

## 快速开始

### 环境准备
1. 安装Rust和Solana CLI
2. 安装Anchor CLI
3. 配置Solana网络

### 编译项目
```bash
# 清理并编译
cargo clean
anchor build
```

### 运行测试
```bash
# 运行简化测试
ANCHOR_PROVIDER_URL=http://localhost:8899 ANCHOR_WALLET=~/.config/solana/id.json node simple-test.js

# 运行完整测试套件（需要启动验证器）
anchor test
```

### 部署合约
```bash
# 部署到本地网络
anchor deploy

# 部署到开发网络
anchor deploy --provider.cluster devnet
```

## 合约接口

### MSC代币管理
- `initialize_msc_token()`: 初始化MSC代币
- `mint_msc(amount)`: 铸造指定数量的MSC代币
- `transfer_msc(amount)`: 转账MSC代币
- `batch_airdrop(recipients, amounts)`: 批量空投

### 数据确权与支付
- `pay_and_create_claim(amount, file_hash)`: 原子操作：支付并创建确权记录 (统一价格1 MSC)
- `get_claim()`: 查询确权记录

### 代币兑换
- `initialize_exchange_pool()`: 初始化兑换池
- `swap_msc_to_usdc(amount)`: MSC兑换USDC

## 安全特性

- **权限控制**: 严格的访问控制和权限验证
- **余额检查**: 所有转账操作都包含余额验证
- **溢出保护**: 防止数值溢出攻击
- **重入保护**: 防止重入攻击
- **签名验证**: 确保交易的真实性

## 开发指南

### 添加新功能
1. 在相应的模块文件中添加新的指令
2. 定义相关的账户结构
3. 实现业务逻辑
4. 添加相应的测试用例

### 测试最佳实践
- 为每个功能编写单元测试
- 测试边界条件和错误情况
- 使用模拟数据进行集成测试

## 部署配置

### 网络配置
- **本地网络**: http://localhost:8899
- **开发网络**: https://api.devnet.solana.com
- **主网**: https://api.mainnet-beta.solana.com

### 程序ID
- 开发环境: `F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd`
- 生产环境: 待部署后更新

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。请确保：
- 代码符合Rust和Anchor的最佳实践
- 包含适当的测试用例
- 更新相关文档

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建GitHub Issue
- 发送邮件至项目维护者

---

**注意**: 本项目仍在开发中，请在生产环境使用前进行充分测试。