import { getMarkdown } from '@refly/utils/html2md';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly/utils/env';

export const saveMockedResource = async () => {
  /**
   * TODO: @mrcfps replace pageContent to markdown
   */
  const pageContent = getMarkdown(document?.body);
  const resource = {
    resourceId: 'tempResId',
    title: document?.title || '',
    data: {
      url: location.href,
      title: document?.title || '',
    },
    resourceType: 'weblink',
    isPublic: false,
    readOnly: true,
    collabEnabled: false,
    content: pageContent || '',
  };

  sendMessage(
    {
      name: 'currentMockResource',
      type: 'syncInfo',
      body: {
        currentMockResource: resource,
      },
      source: getRuntime(),
    },
    false,
  );

  return resource;
};
