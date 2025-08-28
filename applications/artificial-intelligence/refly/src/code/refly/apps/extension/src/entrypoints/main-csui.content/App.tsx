import * as _Sentry from '@sentry/react';
import { useEffect, Suspense } from 'react';
// 使用方法
import { useSwitchTheme } from '@/hooks/use-switch-theme';

// hooks
import { useProcessLoginNotify } from '@/hooks/use-process-login-notify';
import { useToggleCSUI } from '@/modules/toggle-copilot/hooks/use-handle-toggle-csui';
// import { useRegisterMouseEvent } from "../hooks/use-register-mouse-event"
import { useBindCommands } from '@/hooks/use-bind-commands';
import { useSetContainerDimension } from '@/hooks/use-set-container-dimension';
// stores
import { useCopilotStore } from '@refly/stores';
import { useUserStore } from '@refly/stores';

// 组件
import { Message, Spin } from '@arco-design/web-react';
import { AppRouter } from '@/routes/index';

// 加载国际化
import '@/i18n/config';

// 样式
import '@/styles/style.css';
import './App.scss';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
// 设置 runtime 环境
import { getEnv, setRuntime } from '@refly/utils/env';
const Sentry = _Sentry;

const sentryDsn = process.env.VITE_SENTRY_DSN;
if (process.env.NODE_ENV !== 'development' && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: getEnv(),
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    tracePropagationTargets: ['localhost', 'https://refly.ai'],
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0,
  });
}

const App = () => {
  // 打开聊天窗口的方式
  const copilotStore = useCopilotStore((state) => ({
    isCopilotOpen: state.isCopilotOpen,
  }));
  const { initMessageListener } = useToggleCSUI();

  const userStore = useUserStore();

  // 绑定快捷键，后续允许用户自定义快捷键
  useBindCommands();
  // 设定主题样式
  useSwitchTheme();
  // 在激活侧边栏时，设置可操作的空间 Dimension，可以使得组件库效果展示好
  useSetContainerDimension();
  // 处理登录状态
  useProcessLoginNotify(() => {
    window?.close();
  });

  // 设置 Message 通知的 container
  useEffect(() => {
    Message.config({
      getContainer: () => getPopupContainer() as HTMLElement,
    });
  }, []);
  useEffect(() => {
    setRuntime('extension-csui');
    userStore.setRuntime('extension-csui');
    initMessageListener();
  }, []);

  return (
    <Suspense fallback={<Spin style={{ marginTop: '200px auto' }} />}>
      <div className="light app-container">
        <div id="refly-app-main" className={copilotStore.isCopilotOpen ? 'main active' : 'main'}>
          {copilotStore.isCopilotOpen ? <AppRouter /> : null}
        </div>
      </div>
    </Suspense>
  );
};

export default Sentry.withProfiler(App);
