import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

// 搜索的内容来源
export enum SearchTarget {
  All = 'all',
  CurrentPage = 'currentPage',
  SelectedPages = 'selectedPages',
  SearchEnhance = 'searchEnhance',
}

export interface SearchState {
  // state
  searchTarget: SearchTarget;

  // method
  setSearchTarget: (searchTarget: SearchTarget) => void;
}

export const defaultState = {
  searchTarget: 'currentPage' as SearchTarget,
};

export const useThreadSearchStateStore = create<SearchState>()(
  devtools((set) => ({
    ...defaultState,

    setSearchTarget: (searchTarget: SearchTarget) => set((state) => ({ ...state, searchTarget })),
  })),
);
