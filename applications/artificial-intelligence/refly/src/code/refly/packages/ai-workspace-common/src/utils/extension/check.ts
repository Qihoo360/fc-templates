export const checkPageUnsupported = (pageUrl: string) => {
  if (pageUrl) {
    const checkBrowserSettingPage =
      pageUrl.startsWith('chrome://') ||
      pageUrl.startsWith('edge://') ||
      pageUrl.startsWith('arc://') ||
      pageUrl.startsWith('about:');
    const checkBrowserExtensionStorePage = [
      'https://browser.google.com/webstore',
      'https://microsoftedge.microsoft.com/addons',
      'https://addons.mozilla.org/en-US/firefox',
      'https://accounts.google.com',
      'https://github.com/login',
    ].some((url) => pageUrl.startsWith(url));

    return checkBrowserSettingPage || checkBrowserExtensionStorePage;
  }

  return true;
};
