import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface CanvasTemplateModal {
  // state
  visible: boolean;

  // method
  setVisible: (val: boolean) => void;
}

export const useCanvasTemplateModal = create<CanvasTemplateModal>()(
  devtools((set) => ({
    visible: false,

    setVisible: (val: boolean) => set({ visible: val }),
  })),
);

export const useCanvasTemplateModalShallow = <T>(selector: (state: CanvasTemplateModal) => T) => {
  return useCanvasTemplateModal(useShallow(selector));
};
