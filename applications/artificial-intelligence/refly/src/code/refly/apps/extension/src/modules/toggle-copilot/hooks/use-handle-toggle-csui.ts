import { useExtensionMessage } from '@/hooks/use-extension-message';
import { useCopilotStore } from '@refly/stores';
import { getRuntime } from '@refly/utils/env';
import { onMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { BackgroundMessage, CopilotMsgName } from '@refly/common-types';
import { useEffect, useRef } from 'react';

interface CopilotStatus {
  name: string;
  isCopilotOpen: boolean;
}

export const useToggleCSUI = () => {
  const messageListenerEventRef = useRef<any>();

  // for listen to Popup event to toggle copilot
  const copilotStore = useCopilotStore();
  const [copilotStatusData] = useExtensionMessage<CopilotStatus>(
    'toggleCopilotFromPopup',
    (req, res) => {
      console.log('toggleCopilotFromPopup', req, res);
      const { isCopilotOpen } = useCopilotStore.getState();
      res.send(isCopilotOpen ? 'true' : 'false');
    },
  );

  const handlerCopilotOpen = (data?: CopilotStatus) => {
    if (data?.name === 'toggleCopilotFromPopup') {
      const { isCopilotOpen } = useCopilotStore.getState();
      copilotStore.setIsCopilotOpen(!isCopilotOpen);
    }
  };

  const onMessageHandler = (event: MessageEvent<any>) => {
    const data = event as any as BackgroundMessage;
    const { name, body } = data || {};

    // sidepanel directly open or close, csui need hide or show
    if ((name as CopilotMsgName) === 'toggleCopilotCSUI') {
      const { isCopilotOpen } = useCopilotStore.getState();
      const isBoolean = typeof body?.isCopilotOpen === 'boolean';
      copilotStore.setIsCopilotOpen(isBoolean ? body?.isCopilotOpen : !isCopilotOpen);
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

  useEffect(() => {
    handlerCopilotOpen(copilotStatusData);
  }, [copilotStatusData]);

  return {
    initMessageListener,
  };
};
