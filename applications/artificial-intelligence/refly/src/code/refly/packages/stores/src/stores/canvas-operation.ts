import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface CanvasOperationState {
  // state
  canvasId: string;
  canvasTitle: string;
  modalVisible: boolean;
  modalType: 'rename' | 'delete' | 'duplicate';

  // method
  openRenameModal: (canvasId: string, canvasTitle: string) => void;
  openDeleteModal: (canvasId: string, canvasTitle: string) => void;
  openDuplicateModal: (canvasId: string, canvasTitle: string) => void;

  reset: () => void;
}

const defaultState = {
  canvasId: '',
  canvasTitle: '',
  modalVisible: false,
  modalType: 'rename' as const,
};

export const useCanvasOperationStore = create<CanvasOperationState>()(
  devtools((set) => ({
    ...defaultState,

    openRenameModal: (canvasId: string, canvasTitle: string) =>
      set({ canvasId, canvasTitle, modalVisible: true, modalType: 'rename' }),
    openDeleteModal: (canvasId: string, canvasTitle: string) =>
      set({ canvasId, canvasTitle, modalVisible: true, modalType: 'delete' }),
    openDuplicateModal: (canvasId: string, canvasTitle: string) =>
      set({ canvasId, canvasTitle, modalVisible: true, modalType: 'duplicate' }),

    reset: () => set({ ...defaultState }),
  })),
);

export const useCanvasOperationStoreShallow = <T>(selector: (state: CanvasOperationState) => T) => {
  return useCanvasOperationStore(useShallow(selector));
};
