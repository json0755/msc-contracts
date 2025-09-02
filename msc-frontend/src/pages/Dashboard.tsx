import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack
} from '@mui/material';
import { WalletConnection } from '../components/WalletConnection';
import { ProgramInitialization } from '../components/ProgramInitialization';
import { BatchAirdrop } from '../components/BatchAirdrop';
import { ClaimManagement } from '../components/ClaimManagement';
import { PaymentHistory } from '../components/PaymentHistory';
import { Notification } from '../components/Notification';

export const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          MSC 合约测试平台
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center">
          Solana Devnet 上的 MSC 代币合约功能测试
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* 钱包连接 */}
        <WalletConnection />

        {/* 程序初始化 */}
        <ProgramInitialization />

        {/* 批量空投 */}
        <BatchAirdrop />

        {/* 声明管理 */}
        <ClaimManagement />

        {/* 支付历史 */}
        <PaymentHistory />

        {/* 程序信息 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            程序信息
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            <Typography variant="body2" color="text.secondary">
              程序ID: F61oRxmdwKKuHcN1rNRshKQDnAQAeqduitwb1sY2J4Yd
            </Typography>
            <Typography variant="body2" color="text.secondary">
              网络: Solana Devnet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              RPC端点: https://api.devnet.solana.com
            </Typography>
          </Box>
        </Paper>
      </Stack>

      {/* 通知组件 */}
      <Notification />
    </Container>
  );
};