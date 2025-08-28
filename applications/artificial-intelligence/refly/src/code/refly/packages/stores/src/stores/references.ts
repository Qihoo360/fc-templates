import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import { type Reference } from '@refly/openapi-schema';
import { proxiedRequest as getClient } from '../requests/proxiedRequest';

export type StateField<T> = {
  data: T;
  loading: boolean;
  error?: Error | string;
};

interface ReferencesParams {
  sourceId?: string;
  sourceType?: 'resource' | 'document';
  targetType?: 'resource' | 'document';
  targetId?: string;
}

export interface ReferencesState {
  domain: 'resource' | 'document';
  id: string;
  deckSize: number;

  references: StateField<Reference[]>;
  referencedBy: StateField<Reference[]>;
  setDomain: (domain: 'resource' | 'document') => void;
  setId: (id: string) => void;
  setDeckSize: (size: number) => void;
  fetchReferences: (params: ReferencesParams) => Promise<void>;
  fetchReferencedBy: (params: ReferencesParams) => Promise<void>;
}

export const useReferencesStore = create<ReferencesState>()(
  persist(
    immer((set, get) => ({
      domain: 'resource',
      id: '',
      deckSize: 0,

      references: {
        data: [],
        loading: false,
      },

      referencedBy: {
        data: [],
        loading: false,
      },

      setDomain: (domain) => {
        set((state) => {
          state.domain = domain;
        });
      },

      setId: (id) => {
        set((state) => {
          state.id = id;
        });
      },

      setDeckSize: (size) => {
        set((state) => {
          state.deckSize = size;
        });
      },

      fetchReferences: async ({ sourceId, sourceType }) => {
        if (sourceId !== get().id || sourceType !== get().domain) {
          return;
        }

        set((state) => {
          state.references.loading = true;
        });

        const { data } = await getClient.queryReferences({
          body: { sourceId, sourceType },
        });

        console.log('references', data);

        if (data.success) {
          set((state) => {
            state.references.data = data.data;
          });
        }

        set((state) => {
          state.references.loading = false;
        });
      },

      fetchReferencedBy: async ({ targetId, targetType }) => {
        if (targetId !== get().id || targetType !== get().domain) {
          return;
        }

        set((state) => {
          state.referencedBy.loading = true;
        });

        const { data } = await getClient.queryReferences({
          body: { targetId, targetType },
        });

        if (data.success) {
          set((state) => {
            state.referencedBy.data = data.data;
          });
        }

        set((state) => {
          state.referencedBy.loading = false;
        });
      },
    })),
    {
      name: 'references-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        domain: state.domain,
        id: state.id,
        references: state.references,
        referencedBy: state.referencedBy,
      }),
    },
  ),
);

export const useReferencesStoreShallow = <T>(selector: (state: ReferencesState) => T) => {
  return useReferencesStore(useShallow(selector));
};
