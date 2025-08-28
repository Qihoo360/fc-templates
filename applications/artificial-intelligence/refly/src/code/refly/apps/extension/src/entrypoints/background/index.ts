import { onExternalMessage } from './events/externalMessage';
import { onActivated } from './events/activated';
import { onMessage } from './events/messages/index';
import { onPort } from './events/ports';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { onDetached } from './events/detached';
import { handleToggleCopilotSidePanel } from './events/messages/toggleCopilot';
import { setRuntime } from '@refly/utils/env';

export const tempTabState: { [key: string]: string } = {};
let _token = '';
export const getToken = () => _token;
export const setToken = (newToken: string) => {
  _token = newToken;
};

let lastUniqueId = '';
export const getLastUniqueId = () => {
  return lastUniqueId;
};
export const setLastUniqueId = (uniqueId: string) => {
  lastUniqueId = uniqueId;
};
export const abortControllerMap = new Map<string, AbortController>();
export const setAbortController = (controller: AbortController, uniqueId: string) => {
  abortControllerMap.set(uniqueId, controller);

  return controller;
};
export const getAbortController = (uniqueId: string) => abortControllerMap.get(uniqueId);

export default defineBackground(() => {
  setRuntime('extension-background');

  // 接收 refly 官网的消息，了解登录的状态
  browser.runtime.onMessageExternal.addListener(onExternalMessage);
  browser.tabs.onActivated.addListener(onActivated);
  browser.tabs.onDetached.addListener(onDetached);
  browser.runtime.onMessage.addListener(onMessage);
  browser.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type === 'toggleCopilot' && msg.name === 'toggleCopilotSidePanel') {
      return handleToggleCopilotSidePanel(msg, sender);
    }
  });
  browser.runtime.onConnect.addListener(onPort);
});
