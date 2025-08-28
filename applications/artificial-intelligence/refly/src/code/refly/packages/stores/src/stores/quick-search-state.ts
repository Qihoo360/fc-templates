import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export interface QuickSearchState {
  // state
  visible: boolean;

  // method
  setVisible: (val: boolean) => void;
}

export const defaultState = {
  visible: false,
};

export const useQuickSearchStateStore = create<QuickSearchState>()(
  devtools((set) => ({
    ...defaultState,

    setVisible: (val: boolean) => set((state) => ({ ...state, visible: val })),
  })),
);

export const useQuickSearchStateStoreShallow = <T>(selector: (state: QuickSearchState) => T) => {
  return useQuickSearchStateStore(useShallow(selector));
};
