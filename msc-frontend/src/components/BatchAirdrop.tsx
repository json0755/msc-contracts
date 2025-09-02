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
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Send,
  Add,
  Delete,
  Upload
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useProgramContext } from '../contexts/ProgramContext';
import { mscProgramUtils } from '../utils/program';
import { AirdropRecipient } from '../types';

export const BatchAirdrop: React.FC = () => {
  const { publicKey } = useWallet();
  const { config, setNotification } = useProgramContext();
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<AirdropRecipient[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const addRecipient = () => {
    if (!newAddress || !newAmount) {
      setNotification({
        open: true,
        message: '请输入有效的地址和数量',
        severity: 'error'
      });
      return;
    }

    try {
      // 验证地址格式
      new PublicKey(newAddress);
      const amount = parseFloat(newAmount);
      
      if (amount <= 0) {
        throw new Error('数量必须大于0');
      }

      const newRecipient: AirdropRecipient = {
        address: newAddress,
        amount: amount
      };

      setRecipients([...recipients, newRecipient]);
      setNewAddress('');
      setNewAmount('');
    } catch (error) {
      setNotification({
        open: true,
        message: '无效的钱包地址格式',
        severity: 'error'
      });
    }
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleBatchAirdrop = async () => {
    if (!publicKey || !config) {
      setNotification({
        open: true,
        message: '请先连接钱包并确保程序已初始化',
        severity: 'error'
      });
      return;
    }

    if (recipients.length === 0) {
      setNotification({
        open: true,
        message: '请至少添加一个接收者',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);
      
      setNotification({
        open: true,
        message: `模拟批量空投成功！向 ${recipients.length} 个地址发送了总计 ${totalAmount} MSC`,
        severity: 'success'
      });

      // 清空接收者列表
      setRecipients([]);

    } catch (error) {
      console.error('批量空投失败:', error);
      setNotification({
        open: true,
        message: `批量空投失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const newRecipients: AirdropRecipient[] = [];

        lines.forEach((line, index) => {
          const [address, amount] = line.split(',').map(s => s.trim());
          if (address && amount) {
            try {
              new PublicKey(address); // 验证地址
              const numAmount = parseFloat(amount);
              if (numAmount > 0) {
                newRecipients.push({ address, amount: numAmount });
              }
            } catch {
              console.warn(`跳过无效行 ${index + 1}: ${line}`);
            }
          }
        });

        setRecipients([...recipients, ...newRecipients]);
        setNotification({
          open: true,
          message: `成功导入 ${newRecipients.length} 个接收者`,
          severity: 'success'
        });
      } catch (error) {
        setNotification({
          open: true,
          message: 'CSV文件格式错误',
          severity: 'error'
        });
      }
    };
    reader.readAsText(file);
  };

  const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Send color="primary" />
            <Typography variant="h6">批量空投</Typography>
          </Box>

          {!config ? (
            <Alert severity="warning">
              请先初始化程序才能进行批量空投
            </Alert>
          ) : (
            <>
              <Alert severity="info">
                批量向多个地址发送 MSC 代币。支持手动添加或CSV文件导入。
              </Alert>

              {/* 添加接收者 */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  添加接收者
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="钱包地址"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="输入Solana钱包地址"
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="数量 (MSC)"
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      inputProps: { min: 0, step: 0.000001 }
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={addRecipient}
                    disabled={!newAddress || !newAmount}
                  >
                    添加
                  </Button>
                </Stack>
              </Box>

              {/* CSV导入 */}
              <Box>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-upload"
                  type="file"
                  onChange={loadFromCSV}
                />
                <label htmlFor="csv-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                  >
                    导入CSV文件
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  CSV格式: 地址,数量 (每行一个接收者)
                </Typography>
              </Box>

              {/* 接收者列表 */}
              {recipients.length > 0 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1">
                      接收者列表 ({recipients.length})
                    </Typography>
                    <Chip
                      label={`总计: ${totalAmount.toFixed(6)} MSC`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {recipients.map((recipient, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={`${recipient.address.slice(0, 8)}...${recipient.address.slice(-8)}`}
                          secondary={`${recipient.amount} MSC`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeRecipient(index)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* 执行空投 */}
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                onClick={handleBatchAirdrop}
                disabled={loading || recipients.length === 0 || !publicKey}
                size="large"
              >
                {loading ? '执行中...' : `执行批量空投 (${recipients.length} 个地址)`}
              </Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};