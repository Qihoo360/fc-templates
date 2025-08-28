import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { More, Location, Delete } from 'refly-icons';
import { useActiveNode } from '@refly/stores';
import { useNodePosition } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-position';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const ResourceTopButtons = () => {
  const { t } = useTranslation();
  const { readonly, canvasId } = useCanvasContext();
  const { activeNode } = useActiveNode(canvasId);
  const { setNodeCenter } = useNodePosition();
  const { deleteNode } = useDeleteNode();

  const handleLocateNode = useCallback(() => {
    if (activeNode?.id) setNodeCenter(activeNode.id, true);
  }, [activeNode?.id, setNodeCenter]);

  const handleDeleteNode = useCallback(() => {
    if (!activeNode) return;
    deleteNode(activeNode as any);
  }, [activeNode, deleteNode]);

  const moreMenuItems: MenuProps['items'] = useMemo(() => {
    return [
      {
        key: 'locateNode',
        label: (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Location size={16} color="var(--refly-text-0)" />
            {t('canvas.nodeActions.centerNode')}
          </div>
        ),
        onClick: handleLocateNode,
      },
      ...(readonly
        ? []
        : [
            { type: 'divider' as const },
            {
              key: 'delete',
              label: (
                <div className="flex items-center gap-2 text-refly-func-danger-default whitespace-nowrap">
                  <Delete size={16} color="var(--refly-func-danger-default)" />
                  {t('canvas.nodeActions.delete')}
                </div>
              ),
              onClick: handleDeleteNode,
            },
          ]),
    ];
  }, [handleDeleteNode, handleLocateNode, t]);

  return (
    <div className="flex items-center gap-3">
      <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
        <Button className="!h-5 !w-5 p-0" size="small" type="text" icon={<More size={16} />} />
      </Dropdown>
    </div>
  );
};
