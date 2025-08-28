import { getRuntime } from '@refly/utils/env';
import {
  onMessage,
  sendMessage,
} from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { BackgroundMessage, CopilotMsgName } from '@refly/common-types';
import { useRef } from 'react';

export const useToggleSidePanel = () => {
  const messageListenerEventRef = useRef<any>();

  const onMessageHandler = async (event: MessageEvent<any>) => {
    const data = event as any as BackgroundMessage;
    const { name, body } = data || {};

    if (
      (name as CopilotMsgName) === 'toggleCopilotSidePanel' &&
      typeof body?.isCopilotOpen === 'boolean' &&
      !body?.isCopilotOpen
    ) {
      console.log('onSidePanelMessage', event);
      window.close();
    }

    if ((name as CopilotMsgName) === 'checkSidePanelOpenStatus') {
      console.log('onSidePanelMessage', event);
      sendMessage({
        type: 'others',
        name: 'checkSidePanelOpenStatus',
        body: {
          isCopilotOpen: true,
        },
        source: getRuntime(),
      });
    }
  };

  const initMessageListener = () => {
    onMessage(onMessageHandler, getRuntime()).then((clearEvent) => {
      messageListenerEventRef.current = clearEvent;
    });

    return () => {
      messageListenerEventRef.current?.();
    };
  };

  return {
    initMessageListener,
  };
};
