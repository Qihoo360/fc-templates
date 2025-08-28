import { Tabs, browser } from 'wxt/browser';

export const sendHeartBeatMessage = (activeInfo: Tabs.OnActivatedActiveInfoType) => {
  // 给 tab 发消息，进行 userProfile 检查，包括更新 i18n 和登录状态
  try {
    // 兼容 sidePanel 和 Content Script
    browser.tabs
      .sendMessage(activeInfo.tabId, {
        name: 'reflyStatusCheck',
      })
      .catch((err) => {
        console.log('send heart beat content script error: ', err);
      });

    browser.runtime
      .sendMessage({
        name: 'reflyStatusCheck',
      })
      .catch((err) => {
        console.log('send heart beat sidePanel error: ', err);
      });
  } catch (err) {
    console.log('send heart beat error: ', err);
  }
};
