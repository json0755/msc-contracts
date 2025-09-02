import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  TextField
} from '@mui/material';
import { 
  getClaimServiceName, 
  getClaimServiceDescription, 
  getClaimPrice,
  formatMscAmount
} from '../types';

interface ServiceSelectorProps {
  onClaimSubmit?: (fileHash: string, price: number) => void;
  disabled?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({ 
  onClaimSubmit, 
  disabled = false 
}) => {
  const [fileHash, setFileHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const validateFileHash = (hash: string): boolean => {
    return hash.length === 64 && /^[a-fA-F0-9]+$/.test(hash);
  };

  const handleSubmit = () => {
    if (!fileHash.trim()) {
      setError('请输入文件哈希值');
      return;
    }
    
    if (!validateFileHash(fileHash)) {
      setError('文件哈希值格式不正确，应为64位十六进制字符串');
      return;
    }
    
    setError('');
    const price = getClaimPrice();
    onClaimSubmit?.(fileHash, price);
  };

  const price = getClaimPrice();
  const formattedPrice = formatMscAmount(price);

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {getClaimServiceName()}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getClaimServiceDescription()}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`价格: ${formattedPrice}`} 
            color="primary" 
            variant="outlined"
          />
        </Box>

        <TextField
          fullWidth
          label="文件哈希值 (SHA-256)"
          value={fileHash}
          onChange={(e) => {
            setFileHash(e.target.value);
            if (error) setError('');
          }}
          placeholder="请输入64位十六进制文件哈希值"
          disabled={disabled}
          sx={{ mb: 2 }}
          helperText="请输入要确权的文件的SHA-256哈希值"
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={disabled || !fileHash.trim()}
          fullWidth
          sx={{ mt: 1 }}
        >
          支付 {formattedPrice} 并创建确权记录
        </Button>

        <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
          点击按钮将执行支付和确权创建的原子操作
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ServiceSelector;