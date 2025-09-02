#!/bin/bash

# MSC Contracts 部署脚本
# 使用方法: ./deploy.sh [network]
# network: local | devnet | mainnet

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖项..."
    
    if ! command -v anchor &> /dev/null; then
        print_error "Anchor CLI 未安装，请先安装 Anchor"
        exit 1
    fi
    
    if ! command -v solana &> /dev/null; then
        print_error "Solana CLI 未安装，请先安装 Solana"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 设置网络
setup_network() {
    local network=${1:-local}
    
    case $network in
        "local")
            print_info "配置本地网络..."
            solana config set --url http://localhost:8899
            ;;
        "devnet")
            print_info "配置开发网络..."
            solana config set --url https://api.devnet.solana.com
            ;;
        "mainnet")
            print_info "配置主网..."
            solana config set --url https://api.mainnet-beta.solana.com
            print_warning "您正在部署到主网，请确保已经充分测试！"
            read -p "继续部署到主网？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "部署已取消"
                exit 0
            fi
            ;;
        *)
            print_error "不支持的网络: $network"
            print_info "支持的网络: local, devnet, mainnet"
            exit 1
            ;;
    esac
    
    print_success "网络配置完成: $network"
}

# 检查钱包余额
check_balance() {
    print_info "检查钱包余额..."
    
    local balance=$(solana balance --lamports)
    local min_balance=1000000000  # 1 SOL in lamports
    
    if [ "$balance" -lt "$min_balance" ]; then
        print_warning "钱包余额不足，当前余额: $(echo "scale=9; $balance/1000000000" | bc) SOL"
        print_info "请确保钱包有足够的SOL用于部署"
    else
        print_success "钱包余额充足: $(echo "scale=9; $balance/1000000000" | bc) SOL"
    fi
}

# 编译合约
build_contracts() {
    print_info "编译合约..."
    
    # 清理之前的构建
    cargo clean
    
    # 构建合约
    if anchor build; then
        print_success "合约编译成功"
    else
        print_error "合约编译失败"
        exit 1
    fi
}

# 部署合约
deploy_contracts() {
    print_info "部署合约..."
    
    if anchor deploy; then
        print_success "合约部署成功"
        
        # 显示程序ID
        local program_id=$(solana address -k target/deploy/msc_contracts-keypair.json)
        print_success "程序ID: $program_id"
        
        # 保存程序ID到文件
        echo "$program_id" > program_id.txt
        print_info "程序ID已保存到 program_id.txt"
        
    else
        print_error "合约部署失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    print_info "验证部署..."
    
    local program_id=$(cat program_id.txt 2>/dev/null || echo "")
    
    if [ -z "$program_id" ]; then
        print_error "无法获取程序ID"
        return 1
    fi
    
    if solana program show "$program_id" &>/dev/null; then
        print_success "部署验证成功"
        solana program show "$program_id"
    else
        print_error "部署验证失败"
        return 1
    fi
}

# 运行测试
run_tests() {
    local network=${1:-local}
    
    if [ "$network" = "local" ]; then
        print_info "运行简化测试..."
        
        if ANCHOR_PROVIDER_URL=http://localhost:8899 ANCHOR_WALLET=~/.config/solana/id.json node simple-test.js; then
            print_success "测试通过"
        else
            print_warning "测试失败，但部署已完成"
        fi
    else
        print_info "跳过测试（非本地网络）"
    fi
}

# 主函数
main() {
    local network=${1:-local}
    
    echo "====================================="
    echo "     MSC Contracts 部署脚本"
    echo "====================================="
    echo
    
    check_dependencies
    setup_network "$network"
    check_balance
    build_contracts
    deploy_contracts
    verify_deployment
    run_tests "$network"
    
    echo
    print_success "🎉 MSC Contracts 部署完成！"
    echo
    print_info "下一步:"
    echo "  1. 记录程序ID: $(cat program_id.txt 2>/dev/null || echo '未找到')"
    echo "  2. 更新前端配置中的程序ID"
    echo "  3. 进行功能测试"
    echo
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi