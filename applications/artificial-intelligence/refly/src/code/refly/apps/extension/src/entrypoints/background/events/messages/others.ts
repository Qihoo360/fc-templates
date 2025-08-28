import { handleGetOpenedTabs } from '@/entrypoints/background/events/messages/getOpenedTabs';
import { getCurrentTab } from '@refly-packages/ai-workspace-common/utils/extension/tabs';
import { browser } from 'wxt/browser';
import { BackgroundMessage } from '@refly/common-types';

export const handleOtherMessage = async (msg: BackgroundMessage) => {
  if (msg?.name === 'getTabId') {
    const lastActiveTab = await getCurrentTab();

    if (!lastActiveTab?.id) return;

    if (msg?.source === 'extension-csui') {
      browser.tabs.sendMessage(lastActiveTab?.id as number, {
        name: msg?.name,
        body: { tabId: lastActiveTab?.id },
      });
    } else if (msg?.source === 'extension-sidepanel') {
      browser.runtime.sendMessage({
        name: msg?.name,
        body: { tabId: lastActiveTab?.id },
      });
    }
  }

  if (msg?.name === 'getOpenedTabs') {
    return await handleGetOpenedTabs(msg);
  }
};
