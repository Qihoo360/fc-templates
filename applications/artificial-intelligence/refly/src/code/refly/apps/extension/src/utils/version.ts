import { browser } from 'wxt/browser';

export const getExtensionVersion = () => {
  return browser.runtime.getManifest().version;
};
