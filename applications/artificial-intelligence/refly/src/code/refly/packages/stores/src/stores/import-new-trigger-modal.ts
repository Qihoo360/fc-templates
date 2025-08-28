import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SkillTrigger } from '@refly/openapi-schema';
import { useShallow } from 'zustand/react/shallow';

interface ImportNewTriggerModal {
  // state
  showtriggerModal: boolean;
  reloadTriggerList?: boolean;
  trigger?: SkillTrigger | null;

  // method
  setShowtriggerModall: (val: boolean) => void;
  setReloadTriggerList: (val: boolean) => void;
  setTrigger: (val: SkillTrigger | null) => void;
}

export const useImportNewTriggerModal = create<ImportNewTriggerModal>()(
  devtools((set) => ({
    showtriggerModal: false,
    reloadTriggerList: false,
    trigger: null,

    setShowtriggerModall: (val: boolean) => set({ showtriggerModal: val }),
    setReloadTriggerList: (val: boolean) => set({ reloadTriggerList: val }),
    setTrigger: (state: SkillTrigger | null) => set({ trigger: state ? { ...state } : null }),
  })),
);

export const useImportNewTriggerModalShallow = <T>(
  selector: (state: ImportNewTriggerModal) => T,
) => {
  return useImportNewTriggerModal(useShallow(selector));
};
