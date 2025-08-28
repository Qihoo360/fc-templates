import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface CopilotState {
  // state
  isCopilotOpen: boolean;

  // method
  setIsCopilotOpen: (val: boolean) => void;
}

export const useCopilotStore = create<CopilotState>()(
  devtools((set) => ({
    isCopilotOpen: false,

    setIsCopilotOpen: (val: boolean) => set({ isCopilotOpen: val }),
  })),
);

export const useCopilotStoreShallow = <T>(selector: (state: CopilotState) => T) => {
  return useCopilotStore(useShallow(selector));
};
