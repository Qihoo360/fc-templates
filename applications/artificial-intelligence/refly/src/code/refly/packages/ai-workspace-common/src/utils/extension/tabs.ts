import { browser, Tabs } from 'wxt/browser';
import { storage } from '@refly-packages/ai-workspace-common/utils/storage';

// 构造一个本地的版本，可以快速获取
export let localLastActiveTab = {} as Tabs.Tab;

export const getCurrentTab = async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0] as Tabs.Tab;
};

export const saveLastActiveTab = async () => {
  localLastActiveTab = await getCurrentTab();
  await storage.setItem('sync:lastActiveTabId', localLastActiveTab?.id);
  await storage.setItem('sync:lastActiveWindowId', localLastActiveTab?.windowId);
};

export const getLastActiveTab = async (): Promise<Tabs.Tab> => {
  if (localLastActiveTab?.id) return localLastActiveTab;

  const tabId = await storage.getItem('sync:lastActiveTabId');
  const windowId = await storage.getItem('sync:lastActiveWindowId');

  return {
    id: tabId as number,
    windowId: windowId as number,
  } as Tabs.Tab;
};
