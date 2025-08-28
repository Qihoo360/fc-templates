/**
 * Deprecated：目前没有使用
 */

import { apiRequest } from '@/requests/apiRequest';
import { useState, useEffect } from 'react';
import { useMatch } from '@refly-packages/ai-workspace-common/utils/router';

export function useWebLinkIndexed() {
  // 标识此网页是否被索引的状态
  const [isWebLinkIndexed, setIsWebLinkIndexed] = useState(false);
  const isHomePage = useMatch('/');

  const getWebsiteIndexStatus = async () => {
    setIsWebLinkIndexed(false);

    const indexRes = await apiRequest({
      name: 'getWebLinkIndexStatus',
      method: 'GET',
      body: {
        url: location.href,
      },
    });

    console.log('weblink index status', indexRes);

    if (indexRes?.data?.length > 0) {
      const indexStatus = indexRes?.data?.[0]?.indexStatus === 'finish';

      if (indexStatus) {
        setIsWebLinkIndexed(true);
      }
    }
  };

  // 获取当前打开网页的索引状态
  useEffect(() => {
    getWebsiteIndexStatus();
  }, [isHomePage, location.href]);

  return {
    isWebLinkIndexed,
    setIsWebLinkIndexed,
  };
}
