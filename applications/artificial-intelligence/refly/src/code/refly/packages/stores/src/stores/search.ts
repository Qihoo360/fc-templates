import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { type Document, type Resource, type SearchResult } from '@refly/openapi-schema';
import { type Mark } from '@refly/common-types';

export interface SearchState {
  // state
  isSearchOpen: boolean;

  canvases: Resource[];
  resources: Resource[];
  documents: Document[];

  // no category  big search res
  noCategoryBigSearchRes: Mark[];

  // 大搜菜单页
  pages: string[];

  // 所有可搜索的资源
  searchedCanvases: SearchResult[];
  searchedResources: SearchResult[];
  searchedDocuments: SearchResult[];

  // method
  setIsSearchOpen: (isSearchOpen: boolean) => void;
  setNotes: (notes: Resource[]) => void;
  setResources: (resources: Resource[]) => void;
  setDocuments: (documents: Document[]) => void;
  setSearchedRes: ({
    canvases,
    resources,
    documents,
  }: {
    canvases: SearchResult[];
    resources: SearchResult[];
    documents: SearchResult[];
  }) => void;
  setNoCategoryBigSearchRes: (noCategoryBigSearchRes: Mark[]) => void;
  setPages: (pages: string[]) => void;
  resetState: () => void;
}

export const defaultState = {
  isSearchOpen: false,
  canvases: [],
  pages: ['home'],
  resources: [],
  documents: [],

  noCategoryBigSearchRes: [],

  searchedCanvases: [],
  searchedResources: [],
  searchedDocuments: [],
};

export const useSearchStore = create<SearchState>()(
  devtools((set) => ({
    ...defaultState,

    setIsSearchOpen: (isSearchOpen: boolean) => set((state) => ({ ...state, isSearchOpen })),
    setNotes: (notes: Resource[]) => set((state) => ({ ...state, canvases: notes })),
    setResources: (resources: Resource[]) => set((state) => ({ ...state, resources })),
    setDocuments: (documents: Document[]) => set((state) => ({ ...state, documents })),
    setSearchedRes: (data) =>
      set((state) => ({
        ...state,
        searchedCanvases: data?.canvases,
        searchedResources: data?.resources,
        searchedDocuments: data?.documents,
      })),
    setNoCategoryBigSearchRes: (noCategoryBigSearchRes: Mark[]) =>
      set((state) => ({ ...state, noCategoryBigSearchRes })),
    setPages: (pages: string[]) => set((state) => ({ ...state, pages })),
    resetState: () => set((state) => ({ ...state, ...defaultState })),
  })),
);

export const useSearchStoreShallow = <T>(selector: (state: SearchState) => T) => {
  return useSearchStore(useShallow(selector));
};
