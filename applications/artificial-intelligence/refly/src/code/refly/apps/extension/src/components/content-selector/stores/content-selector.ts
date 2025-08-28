import { create } from 'zustand';
import { Mark, MarkScope } from '@refly/common-types';
import { useShallow } from 'zustand/react/shallow';

interface ContentSelectorState {
  // state
  showContentSelector: boolean;
  isInjectStyles: boolean;
  marks: Mark[];
  scope: 'block' | 'inline';

  // method
  setShowContentSelector: (val: boolean) => void;
  setIsInjectStyles: (val: boolean) => void;
  setMarks: (marks: Mark[]) => void;
  setScope: (scope: MarkScope) => void;
  resetState: () => void;
}

export const defaultState = {
  showContentSelector: false,
  isInjectStyles: false,
  marks: [],
  scope: 'inline' as MarkScope, // 代表此时激活的状态
};

export const useContentSelectorStore = create<ContentSelectorState>()((set) => ({
  ...defaultState,

  setShowContentSelector: (val: boolean) => set({ showContentSelector: val }),
  setIsInjectStyles: (val: boolean) => set({ isInjectStyles: val }),
  setMarks: (marks: Mark[]) => set({ marks }),
  setScope: (scope: 'block' | 'inline') => set({ scope }),
  resetState: () => set((state) => ({ ...state, ...defaultState })),
}));

export const useContentSelectorStoreShallow = <T>(selector: (state: ContentSelectorState) => T) => {
  return useContentSelectorStore(useShallow(selector));
};
