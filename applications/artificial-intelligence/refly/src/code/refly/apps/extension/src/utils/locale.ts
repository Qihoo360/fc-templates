export const mapDefaultLocale = (locale: string) => {
  if (locale?.toLocaleLowerCase()?.startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en';
};
