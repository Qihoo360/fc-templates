import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface PilotState {
  // state
  isPilotOpen: boolean;
  activeSessionId: string | null;
  isNewTask: boolean;
  // method
  setIsPilotOpen: (val: boolean) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  setIsNewTask: (isNewTask: boolean) => void;
}

export const usePilotStore = create<PilotState>()(
  devtools(
    persist(
      (set) => ({
        isPilotOpen: false,
        activeSessionId: null,
        isNewTask: false,
        setIsPilotOpen: (val: boolean) => set({ isPilotOpen: val }),
        setActiveSessionId: (sessionId: string | null) => set({ activeSessionId: sessionId }),
        setIsNewTask: (isNewTask: boolean) => set({ isNewTask }),
      }),
      {
        name: 'pilot-storage', // unique name for the localStorage key
        partialize: (state) => ({
          isPilotOpen: state.isPilotOpen,
        }), // only persist these fields
      },
    ),
  ),
);

export const usePilotStoreShallow = <T>(selector: (state: PilotState) => T) => {
  return usePilotStore(useShallow(selector));
};
