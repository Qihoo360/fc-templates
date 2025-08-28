import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';

type ITab = 'session-library' | 'home';

export interface HomeState {
  // state
  activeTab: ITab;

  // method
  setActiveTab: (val: ITab) => void;
}

export const defaultState = {
  activeTab: 'home' as ITab,
};

export const useHomeStateStore = create<HomeState>()(
  devtools((set) => ({
    ...defaultState,

    setActiveTab: (val: ITab) => set((state) => ({ ...state, activeTab: val })),
  })),
);
