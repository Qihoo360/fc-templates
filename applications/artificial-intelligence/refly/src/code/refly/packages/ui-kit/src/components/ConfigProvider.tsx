import { ConfigProvider } from 'antd';
import { useConfigProviderStore } from '../store/useConfigProviderStore';

export function ReflyConfigProvider({ children }: { children: React.ReactNode }) {
  const theme = useConfigProviderStore((state) => state.theme);
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}
