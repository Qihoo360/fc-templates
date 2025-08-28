import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { Location, Delete } from 'refly-icons';
import { CanvasNode } from '@refly/canvas-common';
import cn from 'classnames';
import { useCallback } from 'react';
import { useNodePosition } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-position';
import { useReactFlow } from '@xyflow/react';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { useActiveNode } from '@refly/stores';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const ResourceItemAction = ({
  node,
  className,
}: {
  node: CanvasNode;
  className?: string;
}) => {
  const { t } = useTranslation();
  const { readonly, canvasId } = useCanvasContext();
  const { setNodeCenter } = useNodePosition();
  const { getNodes } = useReactFlow();
  const { deleteNode } = useDeleteNode();
  const { activeNode, setActiveNode } = useActiveNode(canvasId);
  const handleLocateNode = (node: CanvasNode) => {
    if (node?.type === 'group') {
      return;
    }
    const nodes = getNodes();
    const foundNode = nodes.find((n) => n.data?.entityId === node.data?.entityId);
    if (foundNode) {
      setNodeCenter(foundNode.id, true);
    }
  };

  const handleDeleteNode = useCallback(
    (node: CanvasNode) => {
      if (!node?.id) {
        return;
      }
      deleteNode({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position ?? { x: 0, y: 0 },
      } as CanvasNode);
      if (activeNode?.id === node.id) {
        setActiveNode(null);
      }
    },
    [activeNode?.id, deleteNode, setActiveNode],
  );

  return (
    <div
      className={cn(
        'items-center gap-1 hidden transition-opacity flex-shrink-0 group-hover:flex',
        className,
      )}
    >
      <Tooltip title={t('canvas.nodeActions.centerNode')} arrow={false}>
        <Button
          type="text"
          size="small"
          icon={<Location size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            handleLocateNode(node);
          }}
        />
      </Tooltip>
      {!readonly && (
        <Tooltip title={t('common.delete')} arrow={false}>
          <Button
            type="text"
            size="small"
            icon={<Delete size={16} color="var(--refly-func-danger-default)" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNode(node);
            }}
          />
        </Tooltip>
      )}
    </div>
  );
};
