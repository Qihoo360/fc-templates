import { ICopilotType } from '@refly/common-types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const copilotTypeEnums = ['extension-sidepanel', 'extension-csui'] as ICopilotType[];

export interface CopilotTypeState {
  copilotType: ICopilotType | undefined;

  setCopilotType: (val: ICopilotType) => void;
  resetState: () => void;
}

export const defaultState = {
  copilotType: undefined as ICopilotType | undefined,
};

export const useCopilotTypeStore = create<CopilotTypeState>()(
  devtools((set) => ({
    ...defaultState,

    setCopilotType: (val: ICopilotType) => set({ copilotType: val }),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);
