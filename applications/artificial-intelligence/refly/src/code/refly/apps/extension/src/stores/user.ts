import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { type User, LOCALE } from '@refly/common-types';
import { type OutputLocale } from '@refly/utils';

export interface LocalSettings {
  uiLocale: LOCALE; // UI 相关的
  outputLocale: OutputLocale; // 模型输出相关的
  isLocaleInitialized: boolean; // locale 是否是初始化状态，用于展示语言
}

export interface UserState {
  // state
  isCheckingLoginStatus: boolean | undefined;
  isLogin: boolean;
  userProfile?: User;
  token?: string;
  localSettings: LocalSettings; // 在获取 user 信息的时候记录这个 settings，并 host 到 localStorage/bgStorage，每次保存更新，类似 userProfile

  // login modal
  loginModalVisible?: boolean;

  // method
  setIsCheckingLoginStatus: (val: boolean) => void;
  setIsLogin: (val: boolean) => void;
  setUserProfile: (val?: User) => void;
  setToken: (val?: string) => void;
  setLoginModalVisible: (val: boolean) => void;
  setLocalSettings: (val: LocalSettings) => void;
  resetState: () => void;
}

const getDefaultLocale = () => {
  const language = navigator.language;

  if (language?.startsWith('en')) {
    return LOCALE.EN;
  }

  if (language?.startsWith('zh')) {
    return 'zh-CN';
  }

  return LOCALE.EN;
};

export const defaultLocalSettings = {
  uiLocale: getDefaultLocale(),
  outputLocale: navigator.language,
  isLocaleInitialized: false, // locale 是否是初始化状态，用于展示语言
} as LocalSettings;

export const defaultState = {
  // messages: fakeMessages as any,
  isCheckingLoginStatus: false,
  isLogin: false,
  userProfile: undefined,
  token: '',
  loginModalVisible: false,
  localSettings: { ...defaultLocalSettings }, // 默认使用浏览器的 navigator 获取语言，插件里面使用 chrome.i18n.detectLanguage
};

export const useUserStore = create<UserState>()(
  devtools((set) => ({
    ...defaultState,

    setIsCheckingLoginStatus: (val: boolean) =>
      set((state) => ({ ...state, isCheckingLoginStatus: val })),
    setIsLogin: (val: boolean) => set((state) => ({ ...state, isLogin: val })),
    setUserProfile: (val?: User) => set((state) => ({ ...state, userProfile: val })),
    setToken: (val?: string) => set((state) => ({ ...state, token: val })),
    setLoginModalVisible: (val: boolean) => set((state) => ({ ...state, loginModalVisible: val })),
    setLocalSettings: (val: LocalSettings) => set((state) => ({ ...state, localSettings: val })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
