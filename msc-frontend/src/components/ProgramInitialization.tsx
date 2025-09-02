import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { Settings, Rocket } from '@mui/icons-material';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useProgramContext } from '../contexts/ProgramContext';
import { mscProgramUtils } from '../utils/program';
import { PROGRAM_ID } from '../types';

export const ProgramInitialization: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { config, refreshConfig, setNotification } = useProgramContext();
  const [loading, setLoading] = useState(false);
  const [initialSupply, setInitialSupply] = useState('10000000'); // 10M tokens

  const handleInitialize = async () => {
    if (!publicKey) {
      setNotification({
        open: true,
        message: '请先连接钱包',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      // 获取配置PDA
      const [configPda] = await mscProgramUtils.getConfigPDA();
      
      // 检查配置是否已存在
      const configAccount = await connection.getAccountInfo(configPda);
      if (configAccount) {
        setNotification({
          open: true,
          message: '程序已经初始化过了',
          severity: 'warning'
        });
        return;
      }

      // 创建mint账户 (这里使用模拟的公钥)
      const mintKeypair = PublicKey.default;
      
      // 获取关联代币账户
      const userTokenAccount = await mscProgramUtils.getAssociatedTokenAccount(
        mintKeypair,
        publicKey
      );

      // 构建初始化指令
      // 注意：这里使用模拟的指令构建，实际应用中需要根据程序的IDL来构建
      const instruction = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: configPda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: mintKeypair, isSigner: false, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
          // 指令索引 (假设初始化指令是0)
          0,
          // 初始供应量 (8字节小端序)
          ...Array.from(new Uint8Array(new BigUint64Array([BigInt(initialSupply + '000000')]).buffer))
        ])
      };

      // 由于我们没有完整的程序接口，这里显示一个模拟的成功消息
      setNotification({
        open: true,
        message: `模拟初始化成功！初始供应量: ${initialSupply} MSC`,
        severity: 'success'
      });

      // 刷新配置
      await refreshConfig();

    } catch (error) {
      console.error('初始化失败:', error);
      setNotification({
        open: true,
        message: `初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Settings color="primary" />
            <Typography variant="h6">程序初始化</Typography>
          </Box>

          {config ? (
            <Alert severity="success">
              程序已初始化！代币供应量: {mscProgramUtils.formatAmount(config.totalSupply)} MSC
            </Alert>
          ) : (
            <>
              <Alert severity="info">
                首次使用需要初始化 MSC 代币程序。这将创建代币配置和初始供应量。
              </Alert>

              <TextField
                label="初始供应量 (MSC)"
                type="number"
                value={initialSupply}
                onChange={(e) => setInitialSupply(e.target.value)}
                fullWidth
                helperText="建议设置为 10,000,000 MSC"
                InputProps={{
                  inputProps: { min: 1000000, max: 1000000000 }
                }}
              />

              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Rocket />}
                onClick={handleInitialize}
                disabled={loading || !publicKey}
                size="large"
              >
                {loading ? '初始化中...' : '初始化程序'}
              </Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};