import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { mscProgramUtils } from '../utils/program';
import { PROGRAM_ID, MscTokenConfig, NotificationState } from '../types';

interface ProgramContextType {
  program: anchor.Program | null;
  provider: anchor.AnchorProvider | null;
  isInitialized: boolean;
  config: MscTokenConfig | null;
  loading: boolean;
  error: string | null;
  notification: NotificationState;
  setNotification: (notification: NotificationState) => void;
  refreshConfig: () => Promise<void>;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

interface ProgramContextProviderProps {
  children: ReactNode;
}

export const ProgramContextProvider: React.FC<ProgramContextProviderProps> = ({ children }) => {
  const { wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [provider, setProvider] = useState<anchor.AnchorProvider | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<MscTokenConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 初始化程序
  useEffect(() => {
    const initializeProgram = async () => {
      if (!wallet || !publicKey) {
        setProgram(null);
        setProvider(null);
        setIsInitialized(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 创建provider
        const anchorProvider = new anchor.AnchorProvider(
          connection,
          wallet.adapter as any,
          anchor.AnchorProvider.defaultOptions()
        );

        setProvider(anchorProvider);
        anchor.setProvider(anchorProvider);

        // 由于我们没有IDL文件，我们将使用原始的RPC调用
        // 这里先设置为已初始化，实际的程序调用将在各个组件中处理
        setIsInitialized(true);
        
        await refreshConfig();
      } catch (err) {
        console.error('Failed to initialize program:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize program');
      } finally {
        setLoading(false);
      }
    };

    initializeProgram();
  }, [wallet, publicKey, connection]);

  // 刷新配置
  const refreshConfig = async () => {
    try {
      const [configPda] = await mscProgramUtils.getConfigPDA();
      
      // 尝试获取配置账户信息
      const configAccount = await connection.getAccountInfo(configPda);
      
      if (configAccount) {
        // 这里应该解析账户数据，但由于没有IDL，我们使用模拟数据
        const mockConfig: MscTokenConfig = {
          authority: publicKey || PublicKey.default,
          mint: PublicKey.default, // 实际应用中需要从配置中读取
          totalSupply: new anchor.BN(10000000000000), // 10M tokens with 6 decimals
          decimals: 6,
          isInitialized: true
        };
        setConfig(mockConfig);
      } else {
        setConfig(null);
      }
    } catch (err) {
      console.error('Failed to refresh config:', err);
      // 不设置错误状态，因为配置可能还未初始化
    }
  };

  const contextValue: ProgramContextType = {
    program,
    provider,
    isInitialized,
    config,
    loading,
    error,
    notification,
    setNotification,
    refreshConfig
  };

  return (
    <ProgramContext.Provider value={contextValue}>
      {children}
    </ProgramContext.Provider>
  );
};

// 自定义Hook
export const useProgramContext = () => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgramContext must be used within a ProgramContextProvider');
  }
  return context;
};