import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { PublicKey } from '@solana/web3.js';
import { useProgramContext } from '../contexts/ProgramContext';
import { useWallet } from '@solana/wallet-adapter-react';

// 简化的支付记录接口
interface SimplePaymentRecord {
  id: string;
  amount: string;
  serviceType: string;
  status: string;
  timestamp: Date;
  recipient: string;
  transactionId: string;
}

export const PaymentHistory: React.FC = () => {
  const { publicKey } = useWallet();
  const { setNotification } = useProgramContext();
  const [payments, setPayments] = useState<SimplePaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SimplePaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<SimplePaymentRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  // 模拟数据
  useEffect(() => {
    if (publicKey) {
      const now = new Date();
      const mockPayments: SimplePaymentRecord[] = [
        {
          id: '1',
          amount: '100',
          serviceType: 'File Storage',
          status: 'Completed',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2小时前
          recipient: publicKey.toString(),
          transactionId: 'tx_001'
        },
        {
          id: '2',
          amount: '250',
          serviceType: 'Data Processing',
          status: 'Pending',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1天前
          recipient: publicKey.toString(),
          transactionId: 'tx_002'
        },
        {
          id: '3',
          amount: '75',
          serviceType: 'API Access',
          status: 'Failed',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3天前
          recipient: publicKey.toString(),
          transactionId: 'tx_003'
        }
      ];
      setPayments(mockPayments);
      setFilteredPayments(mockPayments);
    }
  }, [publicKey]);

  // 过滤支付记录
  useEffect(() => {
    let filtered = payments;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(p => p.serviceType === serviceFilter);
    }
    
    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [payments, statusFilter, serviceFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon />;
      case 'Pending':
        return <ScheduleIcon />;
      case 'Failed':
        return <ErrorIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // 格式化相对时间
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return timestamp.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // 分页
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // 统计信息
  const totalAmount = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const completedCount = payments.filter(p => p.status === 'Completed').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const failedCount = payments.filter(p => p.status === 'Failed').length;

  if (!publicKey) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            支付历史
          </Typography>
          <Typography color="text.secondary">
            请先连接钱包以查看支付历史
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          支付历史
        </Typography>

        {/* 统计信息 */}
         <Box display="flex" gap={2} mb={3} flexWrap="wrap">
           <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
             <Typography variant="h6">{totalAmount.toFixed(2)}</Typography>
             <Typography variant="body2" color="text.secondary">总金额 (MSC)</Typography>
           </Paper>
           <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
             <Typography variant="h6">{completedCount}</Typography>
             <Typography variant="body2" color="text.secondary">已完成</Typography>
           </Paper>
           <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
             <Typography variant="h6">{pendingCount}</Typography>
             <Typography variant="body2" color="text.secondary">待处理</Typography>
           </Paper>
           <Paper sx={{ p: 2, textAlign: 'center', minWidth: 120 }}>
             <Typography variant="h6">{failedCount}</Typography>
             <Typography variant="body2" color="text.secondary">失败</Typography>
           </Paper>
         </Box>

        {/* 过滤器 */}
        <Box display="flex" gap={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>状态</InputLabel>
            <Select
              value={statusFilter}
              label="状态"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="Completed">已完成</MenuItem>
              <MenuItem value="Pending">待处理</MenuItem>
              <MenuItem value="Failed">失败</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>服务类型</InputLabel>
            <Select
              value={serviceFilter}
              label="服务类型"
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <MenuItem value="all">全部</MenuItem>
              <MenuItem value="File Storage">文件存储</MenuItem>
              <MenuItem value="Data Processing">数据处理</MenuItem>
              <MenuItem value="API Access">API访问</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 支付记录列表 */}
        <List>
          {paginatedPayments.map((payment) => (
            <ListItem
              key={payment.id}
              divider
              secondaryAction={
                <Button
                  startIcon={<VisibilityIcon />}
                  onClick={() => setSelectedPayment(payment)}
                  size="small"
                >
                  查看详情
                </Button>
              }
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle1">
                      {payment.amount} MSC
                    </Typography>
                    <Chip
                      icon={getStatusIcon(payment.status)}
                      label={payment.status}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                    <Chip
                      label={payment.serviceType}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatRelativeTime(payment.timestamp)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {payment.transactionId}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* 分页 */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}

        {/* 支付详情对话框 */}
        <Dialog
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>支付详情</DialogTitle>
          <DialogContent>
            {selectedPayment && (
              <Box>
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    金额
                  </Typography>
                  <Typography variant="h6">
                    {selectedPayment.amount} MSC
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    状态
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedPayment.status)}
                    label={selectedPayment.status}
                    color={getStatusColor(selectedPayment.status)}
                  />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    服务类型
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.serviceType}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    时间
                  </Typography>
                  <Typography variant="body1">
                    {formatRelativeTime(selectedPayment.timestamp)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPayment.timestamp.toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    接收方
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    {selectedPayment.recipient}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    交易ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    {selectedPayment.transactionId}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedPayment(null)}>关闭</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};