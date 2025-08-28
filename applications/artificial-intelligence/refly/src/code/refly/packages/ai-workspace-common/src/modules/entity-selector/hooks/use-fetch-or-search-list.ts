import { SearchDomain, SearchResult } from '@refly/openapi-schema';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useFetchDataList } from '@refly-packages/ai-workspace-common/hooks/use-fetch-data-list';
import {
  DataFetcher,
  domainToFetchData,
} from '@refly-packages/ai-workspace-common/modules/entity-selector/utils';

export type ListMode = 'fetch' | 'search';

export const useFetchOrSearchList = ({
  domain,
  fetchData,
  pageSize = 10,
}: {
  domain: SearchDomain;
  fetchData?: DataFetcher;
  pageSize?: number;
}) => {
  const [mode, setMode] = useState<ListMode>('fetch');

  if (!fetchData) {
    fetchData = domainToFetchData[domain];
    if (!fetchData) {
      throw new Error(`Domain ${domain} not supported`);
    }
  }

  // fetch
  const {
    hasMore,
    setHasMore,
    loadMore,
    currentPage,
    setCurrentPage,
    dataList: fetchList,
    setDataList: setFetchList,
    isRequesting: fetchRequesting,
    resetState,
  } = useFetchDataList({
    fetchData,
    pageSize,
  });

  // we store search list in a separate state to avoid re-fetching the list
  // when switching between fetch and search mode
  const [searchList, setSearchList] = useState<SearchResult[]>([]);

  // whether search is requesting
  const [searchRequesting, setSearchRequesting] = useState(false);

  const debouncedSearch: ({
    searchVal,
    domains,
  }: { searchVal: string; domains?: Array<SearchDomain> }) => any = useDebouncedCallback(
    async ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => {
      try {
        setSearchRequesting(true);
        const res = await getClient().search({
          body: {
            query: searchVal,
            domains,
          },
        });

        const resData = res?.data?.data || [];

        setSearchList(resData);
      } catch (err) {
        console.error('debounced search err: ', err);
      } finally {
        setSearchRequesting(false);
      }
    },
    200,
  );

  const handleValueChange = async (searchVal: string, domains: SearchDomain[]) => {
    if (!searchVal) {
      setMode('fetch');
    } else {
      setMode('search');
      debouncedSearch({
        searchVal,
        domains,
      });
      setHasMore(true);
      setCurrentPage(1);
    }
  };

  return {
    resetState,
    mode,
    setMode,
    hasMore,
    loadMore,
    dataList: mode === 'search' ? searchList : fetchList,
    setDataList: mode === 'search' ? setSearchList : setFetchList,
    currentPage,
    isRequesting: fetchRequesting || searchRequesting,
    debouncedSearch,
    handleValueChange,
  };
};
