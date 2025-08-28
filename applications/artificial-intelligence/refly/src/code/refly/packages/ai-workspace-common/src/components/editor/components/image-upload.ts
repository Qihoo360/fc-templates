import { message } from 'antd';
import { EntityType } from '@refly/openapi-schema';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { createImageUpload } from '@refly-packages/ai-workspace-common/components/editor/core/plugins';

export const createUploadFn = (param: { entityId: string; entityType: string }) => {
  return createImageUpload({
    onUpload: async (file: File) => {
      const { data, error } = await getClient().upload({
        body: {
          file,
          entityId: param.entityId,
          entityType: param.entityType as EntityType,
        },
      });

      if (error) {
        message.error('Upload failed');
        return false;
      }

      return data?.data?.url;
    },
    validateFn: (file) => {
      if (!file.type.includes('image/')) {
        message.error('File type not supported.');
        return false;
      }
      if (file.size / 1024 / 1024 > 20) {
        message.error('File size too big (max 20MB).');
        return false;
      }
      return true;
    },
  });
};
