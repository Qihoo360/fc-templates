import { useEffect } from 'react';
import { browser } from 'wxt/browser';

export const useProcessLoginNotify = (callback: (request?: any) => void) => {
  // 收到消息之后，关闭窗口
  const handleExtensionMessage = (request: any) => {
    if (request?.data?.name === 'refly-login-notify') {
      console.log('activate useProcessLoginNotify', request);
      callback(request);
    }
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(handleExtensionMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleExtensionMessage);
    };
  }, []);
};
