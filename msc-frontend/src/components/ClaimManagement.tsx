import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs
} from '@mui/material';
import {
  Assignment,
  Add,
  Visibility,
  CheckCircle,
  Pending
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgramContext } from '../contexts/ProgramContext';
import { mscProgramUtils } from '../utils/program';
import { OwnershipClaim, ClaimStatus } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`claim-tabpanel-${index}`}
      aria-labelledby={`claim-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// 辅助函数
const getStatusIcon = (status: ClaimStatus): React.ReactElement => {
  switch (status) {
    case ClaimStatus.Verified:
      return <CheckCircle />;
    case ClaimStatus.Pending:
      return <Pending />;
    default:
      return <Assignment />;
  }
};

const getStatusColor = (status: ClaimStatus): 'success' | 'warning' | 'default' => {
  switch (status) {
    case ClaimStatus.Verified:
      return 'success';
    case ClaimStatus.Pending:
      return 'warning';
    default:
      return 'default';
  }
};

export const ClaimManagement: React.FC = () => {
  const { publicKey } = useWallet();
  const { config, setNotification } = useProgramContext();
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<OwnershipClaim[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<OwnershipClaim | null>(null);
  
  // 创建声明的表单状态
  const [fileHash, setFileHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');

  // 模拟的声明数据
  useEffect(() => {
    if (publicKey) {
      const mockClaims: OwnershipClaim[] = [
        {
          owner: publicKey,
          fileHash: 'QmX1Y2Z3...',
          fileName: 'document1.pdf',
          description: '重要合同文档',
          timestamp: new Date('2024-01-15'),
          status: ClaimStatus.Verified,
          verifier: publicKey,
          transactionId: 'tx123',
          isActive: true
        },
        {
          owner: publicKey,
          fileHash: 'QmA4B5C6...',
          fileName: 'image.jpg',
          description: '版权图片',
          timestamp: new Date('2024-01-10'),
          status: ClaimStatus.Pending,
          verifier: undefined,
          transactionId: 'tx456',
          isActive: true
        }
      ];
      setClaims(mockClaims);
    }
  }, [publicKey]);

  const handleCreateClaim = async () => {
    if (!publicKey || !config) {
      setNotification({
        open: true,
        message: '请先连接钱包并确保程序已初始化',
        severity: 'error'
      });
      return;
    }

    if (!fileHash || !fileName) {
      setNotification({
        open: true,
        message: '请填写文件哈希和文件名',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      // 生成文件哈希（如果用户没有提供）
      const hash = fileHash || mscProgramUtils.generateFileHash(fileName + description);
      
      const newClaim: OwnershipClaim = {
        owner: publicKey,
        fileHash: hash,
        fileName,
        description,
        timestamp: new Date(),
        status: ClaimStatus.Pending,
        verifier: undefined,
        transactionId: 'mock-tx-' + Date.now(),
        isActive: true
      };

      // 模拟创建声明
      setClaims([newClaim, ...claims]);
      
      setNotification({
        open: true,
        message: `声明创建成功！文件: ${fileName}`,
        severity: 'success'
      });

      // 清空表单
      setFileHash('');
      setFileName('');
      setDescription('');

    } catch (error) {
      console.error('创建声明失败:', error);
      setNotification({
        open: true,
        message: `创建声明失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClaim = async (claim: OwnershipClaim) => {
    try {
      setLoading(true);
      
      // 模拟验证过程
      const updatedClaims = claims.map(c => 
        c.fileHash === claim.fileHash 
          ? { ...c, status: ClaimStatus.Verified, verifier: publicKey || undefined }
          : c
      );
      setClaims(updatedClaims);
      
      setNotification({
        open: true,
        message: '声明验证成功！',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `验证失败: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewClaim = (claim: OwnershipClaim) => {
    setSelectedClaim(claim);
    setDialogOpen(true);
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Verified:
        return 'success';
      case ClaimStatus.Pending:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Verified:
        return <CheckCircle />;
      case ClaimStatus.Pending:
        return <Pending />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Assignment color="primary" />
            <Typography variant="h6">声明管理</Typography>
          </Box>

          {!config ? (
            <Alert severity="warning">
              请先初始化程序才能管理声明
            </Alert>
          ) : (
            <>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="创建声明" />
                <Tab label={`我的声明 (${claims.length})`} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Stack spacing={3}>
                  <Alert severity="info">
                    创建文件所有权声明，记录在区块链上以证明文件的所有权和时间戳。
                  </Alert>

                  <TextField
                    label="文件名"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    fullWidth
                    placeholder="例如: document.pdf"
                  />

                  <TextField
                    label="文件哈希 (可选)"
                    value={fileHash}
                    onChange={(e) => setFileHash(e.target.value)}
                    fullWidth
                    placeholder="如果留空将自动生成"
                    helperText="建议使用 SHA-256 或 IPFS 哈希"
                  />

                  <TextField
                    label="描述"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="文件描述或备注信息"
                  />

                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                    onClick={handleCreateClaim}
                    disabled={loading || !fileName || !publicKey}
                    size="large"
                  >
                    {loading ? '创建中...' : '创建声明'}
                  </Button>
                </Stack>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {claims.length === 0 ? (
                  <Alert severity="info">
                    您还没有创建任何声明。切换到"创建声明"标签页开始创建。
                  </Alert>
                ) : (
                  <List>
                    {claims.map((claim, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">
                                {claim.fileName}
                              </Typography>
                              <Chip
                                label={claim.status}
                                color={getStatusColor(claim.status) as any}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                {claim.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                创建时间: {claim.timestamp.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" fontFamily="monospace">
                                哈希: {claim.fileHash}
                              </Typography>
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewClaim(claim)}
                            >
                              查看
                            </Button>
                            {claim.status === ClaimStatus.Pending && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckCircle />}
                                onClick={() => handleVerifyClaim(claim)}
                                disabled={loading}
                              >
                                验证
                              </Button>
                            )}
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>
            </>
          )}
        </Stack>
      </CardContent>

      {/* 声明详情对话框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>声明详情</DialogTitle>
        <DialogContent>
          {selectedClaim && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  文件名
                </Typography>
                <Typography variant="body1">{selectedClaim.fileName}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  状态
                </Typography>
                <Chip
                  label={selectedClaim.status}
                  color={getStatusColor(selectedClaim.status) as any}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  文件哈希
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {selectedClaim.fileHash}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  描述
                </Typography>
                <Typography variant="body1">{selectedClaim.description}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  所有者
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {selectedClaim.owner.toString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  创建时间
                </Typography>
                <Typography variant="body1">
                  {selectedClaim.timestamp.toLocaleString()}
                </Typography>
              </Box>

              {selectedClaim.verifier && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    验证者
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedClaim.verifier.toString()}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};