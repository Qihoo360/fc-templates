import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { setRuntime } from '@refly/utils/env';
import { MemoryRouter, Route } from '@refly-packages/ai-workspace-common/utils/router';
import { AppRouter } from '@/routes';
import { ConfigProvider } from 'antd';
import { Login } from '@/pages/login/index.tsx';

setRuntime('extension-popup');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0E9F77',
          borderRadius: 6,
          controlItemBgActive: '#f1f1f0',
          controlItemBgActiveHover: '#e0e0e0',
        },
      }}
    >
      <MemoryRouter>
        <AppRouter>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
        </AppRouter>
      </MemoryRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
