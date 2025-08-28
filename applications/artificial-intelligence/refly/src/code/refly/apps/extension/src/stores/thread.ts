import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { OutputLocale } from '@refly/utils';

export interface Thread {
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
  locale: OutputLocale;
}

interface ThreadState {
  threads: Thread[];
  pageSize: number;
  currentPage: number;
  hasMore: boolean;

  updateThreadList: (newThreadList: Thread[]) => void;
  updateCurrentPage: (currentPage: number) => void;
  updateHasMore: (hasMore: boolean) => void;
  resetState: () => void;
}

export const defaultState = {
  threads: [] as Thread[],
  pageSize: 10,
  currentPage: 1,
  hasMore: true,
};

export const useThreadStore = create<ThreadState>()(
  devtools((set) => ({
    ...defaultState,

    updateThreadList: (newThreadList: Thread[]) =>
      set((state) => ({
        ...state,
        threads: state.threads.concat(newThreadList),
      })),
    updateCurrentPage: (currentPage: number) => set((state) => ({ ...state, currentPage })),
    updateHasMore: (hasMore: boolean) => set((state) => ({ ...state, hasMore })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
