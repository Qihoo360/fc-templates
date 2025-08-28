import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Skill, SkillInstance } from '@refly/openapi-schema';

export interface SkillState {
  [skillName: string]: any;
}

interface SkillManageState {
  skillInstances: SkillInstance[];
  isFetchingSkillInstances: boolean;
  isFetchingSkillTemplates: boolean;

  // skills states
  skillState: SkillState;

  selectedSkillInstance: SkillInstance | null;
  selectedSkill: Skill | null;

  // manage skill
  skillManagerModalVisible: boolean;

  setSkillState: (newState: SkillState) => void;
  setSkillInstances: (skillInstances: SkillInstance[]) => void;
  setIsFetchingSkillInstances: (isFetching: boolean) => void;
  setIsFetchingSkillTemplates: (isFetching: boolean) => void;
  setSelectedSkillInstance: (skillInstance: SkillInstance) => void;
  setSelectedSkill: (skill: Skill | null) => void;
  setSkillManagerModalVisible: (visible: boolean) => void;
  resetState: () => void;
}

export const defaultState = {
  // skills
  skillInstances: [],
  skillTemplates: [],
  isFetchingSkillInstances: false,
  isFetchingSkillTemplates: false,
  skillState: {} as SkillState,
  selectedSkillInstance: null,
  selectedSkill: null,
  skillManagerModalVisible: false,
};

export const useSkillStore = create<SkillManageState>()(
  devtools((set) => ({
    ...defaultState,

    // skill
    setSkillState: (newState: SkillState) => set((state) => ({ ...state, skillState: newState })),
    setSkillInstances: (skillInstances: SkillInstance[]) =>
      set((state) => ({ ...state, skillInstances })),
    setIsFetchingSkillInstances: (isFetching: boolean) =>
      set((state) => ({ ...state, isFetchingSkillInstances: isFetching })),
    setIsFetchingSkillTemplates: (isFetching: boolean) =>
      set((state) => ({ ...state, isFetchingSkillTemplates: isFetching })),
    setSelectedSkillInstance: (skillInstance: SkillInstance) =>
      set((state) => ({ ...state, selectedSkillInstance: skillInstance })),
    setSelectedSkill: (skill: Skill | null) => set((state) => ({ ...state, selectedSkill: skill })),
    setSkillManagerModalVisible: (visible: boolean) =>
      set((state) => ({ ...state, skillManagerModalVisible: visible })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useSkillStoreShallow = <T>(selector: (state: SkillManageState) => T) => {
  return useSkillStore(useShallow(selector));
};
