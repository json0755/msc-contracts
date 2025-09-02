import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { WalletContextProvider } from './contexts/WalletContext';
import { ProgramContextProvider } from './contexts/ProgramContext';
import { Dashboard } from './pages/Dashboard';

// 创建主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletContextProvider>
        <ProgramContextProvider>
          <Dashboard />
        </ProgramContextProvider>
      </WalletContextProvider>
    </ThemeProvider>
  );
}

export default App;
