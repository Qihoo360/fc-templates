import { memo, useMemo, useCallback } from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { CanvasNode } from '@refly/canvas-common';
import { CanvasNodeType } from '@refly/openapi-schema';
import { cn } from '@refly/utils/cn';
import { useActiveNode, useCanvasResourcesPanelStoreShallow } from '@refly/stores';
import { useRealtimeCanvasData } from '@refly-packages/ai-workspace-common/hooks/canvas/use-realtime-canvas-data';
import { NodeIcon } from '@refly-packages/ai-workspace-common/components/canvas/nodes/shared/node-icon';
import { ResourceItemAction } from '../share/resource-item-action';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

const { Text } = Typography;

export const ResultList = memo(() => {
  const { t } = useTranslation();
  const { nodes } = useRealtimeCanvasData();
  const { canvasId } = useCanvasContext();
  const { setParentType, searchKeyword } = useCanvasResourcesPanelStoreShallow((state) => ({
    setParentType: state.setParentType,
    searchKeyword: state.searchKeyword,
  }));
  const { activeNode, setActiveNode } = useActiveNode(canvasId);

  // Filter nodes by the specified types and search keyword
  const resultNodes = useMemo(() => {
    if (!nodes?.length) {
      return [];
    }

    let filteredNodes = nodes.filter(
      (node) =>
        ['document', 'codeArtifact', 'website', 'video', 'audio'].includes(node.type) ||
        (node.type === 'image' && !!node.data?.metadata?.resultId),
    );

    // Apply search keyword filtering if provided
    if (searchKeyword?.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filteredNodes = filteredNodes.filter((node) => {
        const title = node.data?.title?.toLowerCase() ?? '';
        const contentPreview = node.data?.contentPreview?.toLowerCase() ?? '';
        const metadata = JSON.stringify(node.data?.metadata ?? {}).toLowerCase();

        return (
          title.includes(keyword) || contentPreview.includes(keyword) || metadata.includes(keyword)
        );
      });
    }

    return filteredNodes;
  }, [nodes, searchKeyword]);

  const handleNodeSelect = useCallback(
    (node: CanvasNode) => {
      setParentType('resultsRecord');
      setActiveNode(node);
    },
    [setParentType, setActiveNode],
  );

  if (!resultNodes?.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-refly-text-2 text-sm leading-5">
        {searchKeyword?.trim()
          ? t('canvas.resourceLibrary.noSearchResults')
          : t('canvas.resourceLibrary.noResultsRecord')}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="h-full flex flex-col gap-2">
        {resultNodes?.map((node: CanvasNode) => (
          <div
            key={node.id}
            className={cn(
              'h-9 group p-2 cursor-pointer hover:bg-refly-tertiary-hover flex items-center justify-between gap-2 text-refly-text-0 rounded-lg',
              activeNode?.id === node.id && 'bg-refly-tertiary-hover',
            )}
            onClick={() => handleNodeSelect(node)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <NodeIcon
                type={node.type as CanvasNodeType}
                small
                url={node.data?.metadata?.imageUrl as string}
              />
              <Text
                ellipsis={{ tooltip: { placement: 'left' } }}
                className={cn('block flex-1 min-w-0 truncate', {
                  'font-semibold': activeNode?.id === node.id,
                })}
              >
                {node.data?.title || t('common.untitled')}
              </Text>
            </div>
            <ResourceItemAction node={node} />
          </div>
        ))}
      </div>
    </div>
  );
});

ResultList.displayName = 'ResultList';
