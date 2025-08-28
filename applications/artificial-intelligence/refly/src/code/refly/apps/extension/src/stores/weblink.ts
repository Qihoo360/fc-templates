import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import type { WebLinkItem } from '@/components/weblink-list/types';
import { type Message } from '@/types';

export interface Thread {
  id: string;
  convId: string;
  userId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  origin: string;
  originPageUrl: string;
  originPageTitle: string;
  createdAt: string;
  updatedAt: string;
}

interface WeblinkState {
  isWebLinkListVisible: boolean;
  webLinkList: WebLinkItem[];
  pageSize: number;
  selectedRow: { key: number | string; content: WebLinkItem }[];
  currentPage: number;
  hasMore: boolean;
  isRequest: boolean;

  currentWeblink: WebLinkItem | null; // 轮训 Ping 当前打开的网页，处理和获取对应的信息
  messages: Message[]; // 用于当前网页快速总结的消息

  updateWebLinkList: (newWebLinkList: WebLinkItem[]) => void;
  updateCurrentPage: (currentPage: number) => void;
  updateHasMore: (hasMore: boolean) => void;
  updateIsRequest: (isRequest: boolean) => void;
  updateIsWebLinkListVisible: (isWebLinkListVisible: boolean) => void;
  updateSelectedRow: (selectedRow: { key: number | string; content: WebLinkItem }[]) => void;
  setCurrentWeblink: (newWeblink: WebLinkItem | null) => void;
  setMessages: (val: Message[]) => void;
  resetState: () => void;
}

export const defaultState = {
  isWebLinkListVisible: false,
  webLinkList: [] as WebLinkItem[],
  selectedRow: [],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
  isRequest: false,
  currentWeblink: null,
  messages: [],
};

export const useWeblinkStore = create<WeblinkState>()(
  devtools((set) => ({
    ...defaultState,

    updateWebLinkList: (newWebLinkList: WebLinkItem[]) =>
      set((state) => ({
        ...state,
        webLinkList: state.webLinkList.concat(newWebLinkList),
      })),
    updateCurrentPage: (currentPage: number) => set((state) => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set((state) => ({ ...state, hasMore })),
    updateIsRequest: (isRequest: boolean) => set((state) => ({ ...state, isRequest })),
    updateIsWebLinkListVisible: (isWebLinkListVisible: boolean) =>
      set((state) => ({ ...state, isWebLinkListVisible })),
    updateSelectedRow: (selectedRow: { key: number | string; content: WebLinkItem }[]) =>
      set((state) => ({ ...state, selectedRow })),
    setCurrentWeblink: (newWeblink: WebLinkItem | null) =>
      set((state) => ({ ...state, currentWeblink: newWeblink })),
    setMessages: (val: Message[]) => set((state) => ({ ...state, messages: val })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
