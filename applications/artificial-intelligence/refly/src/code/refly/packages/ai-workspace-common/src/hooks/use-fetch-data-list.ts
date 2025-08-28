import { useState } from 'react';

export const useFetchDataList = <T = any>({
  fetchData,
  pageSize = 10,
}: {
  fetchData: (payload: { pageSize: number; page: number }) => Promise<{
    success: boolean;
    data?: T[];
  }>;
  pageSize?: number;
}) => {
  // fetch
  const [dataList, setDataList] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const loadMore = async (page?: number) => {
    if (isRequesting || !hasMore) return;

    // 获取数据
    const queryPayload = {
      pageSize,
      page: page ?? currentPage,
    };

    try {
      setIsRequesting(true);
      setCurrentPage(currentPage + 1);

      const res = await fetchData(queryPayload);

      if (!res?.success) {
        setIsRequesting(false);

        return;
      }

      // If this page contains fewer data than pageSize, it is the last page
      if ((res?.data?.length ?? 0) < pageSize) {
        setHasMore(false);
      }

      if (currentPage === 0) {
        setDataList([...(res?.data || [])]);
      } else {
        setDataList([...dataList, ...(res?.data || [])]);
      }
    } catch (err) {
      console.error('fetch data list error', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const reload = async () => {
    try {
      setIsRequesting(true);
      const res = await fetchData({ pageSize, page: 1 });
      if (res?.success) {
        setDataList(res.data || []);
        setCurrentPage(2);
        setHasMore((res.data?.length ?? 0) >= pageSize);
      }
    } catch (err) {
      console.error('reload data list error', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const resetState = () => {
    setDataList([]);
    setCurrentPage(1);
    setHasMore(true);
    setIsRequesting(false);
  };

  return {
    hasMore,
    setHasMore,
    dataList,
    setDataList,
    currentPage,
    setCurrentPage,
    isRequesting,
    setIsRequesting,
    loadMore,
    reload,
    resetState,
  };
};
