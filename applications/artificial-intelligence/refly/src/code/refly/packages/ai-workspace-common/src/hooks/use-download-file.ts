import { useCallback } from 'react';
import { Resource } from '@refly/openapi-schema';
import { serverOrigin } from '@refly/ui-kit';

export const useDownloadFile = () => {
  const downloadFile = useCallback((resource: Resource) => {
    if (resource.downloadURL) {
      window.open(resource.downloadURL, '_blank');
      return;
    }

    if (resource.rawFileKey) {
      const fileUrl = `${serverOrigin}/v1/misc/${resource.rawFileKey}?download=1`;
      window.open(fileUrl, '_blank');
    }
  }, []);

  return { downloadFile };
};
