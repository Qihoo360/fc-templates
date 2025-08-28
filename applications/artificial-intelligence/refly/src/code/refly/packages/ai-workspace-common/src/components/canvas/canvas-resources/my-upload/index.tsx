import { memo, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { CanvasNode } from '@refly/canvas-common';
import { useActiveNode, useCanvasResourcesPanelStoreShallow } from '@refly/stores';
import { useRealtimeCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-realtime-canvas-data';
import { MyUploadItem } from './my-upload-item';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const MyUploadList = memo(() => {
  const { t } = useTranslation();
  const { nodes } = useRealtimeCanvasData();
  const { canvasId } = useCanvasContext();
  const { setParentType, searchKeyword } = useCanvasResourcesPanelStoreShallow((state) => ({
    setParentType: state.setParentType,
    searchKeyword: state.searchKeyword,
  }));
  const { activeNode, setActiveNode } = useActiveNode(canvasId);

  // Filter nodes by resource type
  const resourceNodes = useMemo(() => {
    if (!nodes?.length) {
      return [];
    }

    let filteredNodes = nodes.filter(
      (node) =>
        node.type === 'resource' || (node.type === 'image' && !node.data?.metadata?.resultId),
    );
    if (searchKeyword?.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filteredNodes = filteredNodes.filter((node) => {
        const title = node.data?.title?.toLowerCase() ?? '';
        return title.includes(keyword);
      });
    }

    return filteredNodes;
  }, [nodes, searchKeyword]);

  const handleNodeSelect = useCallback(
    (node: CanvasNode, beforeParsed: boolean) => {
      if (beforeParsed) {
        message.error(
          t('resource.wait_parse_tip', {
            defaultValue: 'The file has not been parsed yet, can not be viewed',
          }),
        );
        return;
      }
      setParentType('myUpload');
      setActiveNode(node);
    },
    [setParentType, setActiveNode],
  );

  if (!resourceNodes?.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-refly-text-2 text-sm leading-5">
        {searchKeyword?.trim()
          ? t('canvas.resourceLibrary.noSearchResults')
          : t('canvas.resourceLibrary.noMyUploads')}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="h-full flex flex-col gap-2">
        {resourceNodes?.map((node: CanvasNode) => (
          <MyUploadItem
            key={node.id}
            node={node}
            isActive={activeNode?.id === node.id}
            onSelect={handleNodeSelect}
          />
        ))}
      </div>
    </div>
  );
});

MyUploadList.displayName = 'MyUploadList';
