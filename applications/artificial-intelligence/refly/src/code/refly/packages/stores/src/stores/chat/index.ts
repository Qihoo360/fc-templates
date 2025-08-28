import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import type { IRuntime } from '@refly/common-types';
import type { ModelInfo, ProviderItem } from '@refly/openapi-schema';

// types
import type { CanvasEditConfig, InPlaceActionType } from '@refly/utils';
import { MessageIntentSource } from '../../types/common';

export type ChatBehavior = 'askIntentMatch' | 'askFollowUp' | 'askNew';
export type ChatMode = 'ask' | 'agent' | 'media';

export interface MessageIntentContext {
  canvasEditConfig?: CanvasEditConfig;
  inPlaceActionType?: InPlaceActionType;
  canvasContext?: {
    canvasId?: string;
  };
  resourceContext?: {
    resourceId?: string; // may sendMessage from resource's copilot
  };
  convId?: string;
  enableWebSearch?: boolean;
  enableDeepReasonWebSearch?: boolean;
  enableKnowledgeBaseSearch?: boolean;
  env: {
    runtime: IRuntime;
    source: MessageIntentSource;
  };
}

export interface ChatState {
  newQAText: string;

  messageIntentContext: MessageIntentContext | undefined; // has messageIntentContext means sendMessage interaction, otherwise means route jump interaction

  selectedModel: ModelInfo | null;
  skillSelectedModel: ModelInfo | null;
  chatMode: ChatMode;
  enableWebSearch: boolean;
  enableDeepReasonWebSearch: boolean;
  enableKnowledgeBaseSearch: boolean;
  mediaSelectedModel: ProviderItem | null;
  mediaModelList: ProviderItem[];
  mediaModelListLoading: boolean;

  // method
  setNewQAText: (val: string) => void;
  setMessageIntentContext: (val: MessageIntentContext) => void;
  setSelectedModel: (val: ModelInfo) => void;
  setSkillSelectedModel: (val: ModelInfo | null) => void;
  setChatMode: (val: ChatMode) => void;
  setEnableWebSearch: (val: boolean) => void;
  setEnableDeepReasonWebSearch: (val: boolean) => void;
  setEnableKnowledgeBaseSearch: (val: boolean) => void;
  setMediaSelectedModel: (val: ProviderItem) => void;
  setMediaModelList: (val: ProviderItem[]) => void;
  setMediaModelListLoading: (val: boolean) => void;
  resetState: () => void;
}

const defaultConfigurableState = {
  selectedModel: null,
  skillSelectedModel: null,
  chatMode: 'ask' as ChatMode,
  enableWebSearch: true,
  enableDeepReasonWebSearch: false,
  enableKnowledgeBaseSearch: true,
  mediaSelectedModel: null,
  mediaModelList: [],
  mediaModelListLoading: false,
};

export const defaultNewQAText = '';

export const defaultExtraState = {
  messageIntentContext: undefined,
};

export const defaultState = {
  newQAText: defaultNewQAText,
  ...defaultConfigurableState,
  ...defaultExtraState,
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        setNewQAText: (val: string) => set({ newQAText: val }),
        setMessageIntentContext: (val: MessageIntentContext) => set({ messageIntentContext: val }),
        setSelectedModel: (val: ModelInfo) => set({ selectedModel: val }),
        setSkillSelectedModel: (val: ModelInfo | null) => set({ skillSelectedModel: val }),
        setChatMode: (val: ChatMode) => set({ chatMode: val }),
        setEnableWebSearch: (val: boolean) => set({ enableWebSearch: val }),
        setEnableDeepReasonWebSearch: (val: boolean) => set({ enableDeepReasonWebSearch: val }),
        setEnableKnowledgeBaseSearch: (val: boolean) => set({ enableKnowledgeBaseSearch: val }),
        setMediaSelectedModel: (val: ProviderItem) => set({ mediaSelectedModel: val }),
        setMediaModelList: (val: ProviderItem[]) => set({ mediaModelList: val }),
        setMediaModelListLoading: (val: boolean) => set({ mediaModelListLoading: val }),
        resetState: () => {
          return set((state) => ({ ...state, ...defaultExtraState }));
        },
      }),
      {
        name: 'chat-storage',
        partialize: (state) => ({
          newQAText: state.newQAText,
          selectedModel: state.selectedModel,
          skillSelectedModel: state.skillSelectedModel,
          chatMode: state.chatMode,
          mediaSelectedModel: state.mediaSelectedModel,
        }),
      },
    ),
  ),
);

export const useChatStoreShallow = <T>(selector: (state: ChatState) => T) => {
  return useChatStore(useShallow(selector));
};
