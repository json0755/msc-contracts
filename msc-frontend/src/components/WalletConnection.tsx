import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button
} from '@mui/material';
import {
  AccountBalanceWallet,
  ContentCopy,
  CheckCircle
} from '@mui/icons-material';
import { useProgramContext } from '../contexts/ProgramContext';

export const WalletConnection: React.FC = () => {
  const { publicKey, connected, wallet } = useWallet();
  const { isInitialized, config, loading } = useProgramContext();
  const [copied, setCopied] = React.useState(false);

  const handleCopyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6">钱包连接</Typography>
          </Box>

          {!connected ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                请连接钱包以开始使用 MSC 合约功能
              </Typography>
              <WalletMultiButton />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Chip
                  icon={<CheckCircle />}
                  label="已连接"
                  color="success"
                  size="small"
                />
                <Chip
                  label={wallet?.adapter.name || '未知钱包'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  钱包地址:
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontFamily="monospace">
                    {publicKey ? formatAddress(publicKey.toString()) : ''}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                    onClick={handleCopyAddress}
                    color={copied ? 'success' : 'primary'}
                  >
                    {copied ? '已复制' : '复制'}
                  </Button>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  程序状态:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip
                    label={loading ? '加载中...' : isInitialized ? '已初始化' : '未初始化'}
                    color={loading ? 'default' : isInitialized ? 'success' : 'warning'}
                    size="small"
                  />
                  {config && (
                    <Chip
                      label="配置已加载"
                      color="info"
                      size="small"
                    />
                  )}
                </Stack>
              </Box>

              <WalletDisconnectButton />
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};