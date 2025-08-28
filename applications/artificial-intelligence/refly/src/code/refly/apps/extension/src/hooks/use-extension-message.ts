import { useEffect, useState } from 'react';
import { Runtime, browser } from 'wxt/browser';

export const useExtensionMessage = <T>(
  name: string,
  onCallback: (req: Runtime.MessageSender, res: { send: (response?: any) => void }) => void,
) => {
  const [extensionData, setExtensionData] = useState<T>();

  const listenToExtensionMessage = (
    message: any,
    sender: Runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    // console.log('listenToExtensionMessage', message);
    if (message?.name === name) {
      setExtensionData(message);
      onCallback(sender, {
        send: sendResponse,
      });
    }
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(listenToExtensionMessage as any);

    return () => {
      browser.runtime.onMessage.removeListener(listenToExtensionMessage);
    };
  }, []);

  return [extensionData];
};
