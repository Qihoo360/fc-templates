import { Reload, More, Share } from 'refly-icons';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { CanvasNode } from '@refly/canvas-common';
import { useTranslation } from 'react-i18next';
import {
  createNodeEventName,
  nodeActionEmitter,
} from '@refly-packages/ai-workspace-common/events/nodeActions';
import { useMemo, useCallback, useState } from 'react';
import { Delete, Doc, Location } from 'refly-icons';
import { useActiveNode, useActionResultStoreShallow } from '@refly/stores';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-document';
import { parseMarkdownCitationsAndCanvasTags } from '@refly/utils/parse';
import { getShareLink } from '@refly-packages/ai-workspace-common/utils/share';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { copyToClipboard } from '@refly-packages/ai-workspace-common/utils';
import { message } from 'antd';
import { useNodePosition } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-position';
import { useDeleteNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-delete-node';
import { useCanvasResourcesPanelStoreShallow, useCanvasStore } from '@refly/stores';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

interface SkillResponseTopButtonsProps {
  node: CanvasNode;
}
export const SkillResponseTopButtons = ({ node }: SkillResponseTopButtonsProps) => {
  const { t } = useTranslation();
  const { readonly, canvasId } = useCanvasContext();

  const resultId = node?.data?.entityId ?? '';
  const { result } = useActionResultStoreShallow((state) => ({
    result: state.resultMap[resultId],
  }));
  const { debouncedCreateDocument, isCreating } = useCreateDocument();
  const { setNodeCenter } = useNodePosition();
  const { deleteNode } = useDeleteNode();
  const { removeLinearThreadMessageByNodeId } = useCanvasStore((state) => ({
    removeLinearThreadMessageByNodeId: state.removeLinearThreadMessageByNodeId,
  }));
  const { setParentType, setWideScreenVisible } = useCanvasResourcesPanelStoreShallow((state) => ({
    setParentType: state.setParentType,
    setWideScreenVisible: state.setWideScreenVisible,
  }));
  const { setActiveNode } = useActiveNode(canvasId);
  const [isSharing, setIsSharing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleReRun = () => {
    nodeActionEmitter.emit(createNodeEventName(node.id, 'rerun'));
  };

  const latestStepContent = useMemo(() => {
    const steps = result?.steps ?? [];
    if (!steps || steps.length === 0) return '';
    for (let i = steps.length - 1; i >= 0; i -= 1) {
      const content = steps[i]?.content ?? '';
      if (content) return content;
    }
    return '';
  }, [result?.steps]);

  const handleSaveAsDocument = useCallback(async () => {
    if (!resultId || !result) return;
    const title = result?.title ?? node?.data?.title ?? t('common.untitled');
    const content = parseMarkdownCitationsAndCanvasTags(latestStepContent, []);
    await debouncedCreateDocument(title ?? '', content ?? '', {
      sourceNodeId: resultId,
      addToCanvas: true,
    });
  }, [debouncedCreateDocument, latestStepContent, node?.data?.title, result, resultId, t]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    setIsSharing(true);
    const loadingMessage = message.loading(t('common.sharing'), 0);
    try {
      const { data, error } = await getClient().createShare({
        body: {
          entityId: result.resultId ?? resultId,
          entityType: 'skillResponse',
          shareData: JSON.stringify(result ?? {}),
        },
      });
      if (!data?.success || error) {
        throw new Error(error ? String(error) : 'Failed to share skill response');
      }
      const shareLink = getShareLink('skillResponse', data.data?.shareId ?? '');
      copyToClipboard(shareLink);
      loadingMessage();
      message.success(
        t(
          'canvas.skillResponse.shareSuccess',
          'Skill response shared successfully! Link copied to clipboard.',
        ),
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to share skill response:', err);
      loadingMessage();
      message.error(t('canvas.skillResponse.shareError', 'Failed to share skill response'));
    } finally {
      setIsSharing(false);
    }
  }, [result, resultId, t]);

  const handleLocateNode = useCallback(() => {
    if (node?.id) setNodeCenter(node.id, true);
  }, [node?.id, setNodeCenter]);

  const handleDeleteNode = useCallback(() => {
    if (!node?.id) return;
    removeLinearThreadMessageByNodeId(node.id);
    deleteNode({
      id: node.id,
      type: 'skillResponse',
      position: { x: 0, y: 0 },
      data: {
        title: node?.data?.title ?? result?.title ?? '',
        entityId: node?.data?.entityId ?? resultId,
      },
    });
    setWideScreenVisible(false);
    setParentType(null);
  }, [
    deleteNode,
    node,
    removeLinearThreadMessageByNodeId,
    result?.title,
    resultId,
    setActiveNode,
    setParentType,
    setWideScreenVisible,
  ]);

  const moreMenuItems: MenuProps['items'] = useMemo(() => {
    return [
      ...(readonly
        ? []
        : [
            {
              key: 'saveAsDocument',
              disabled: !latestStepContent || isCreating,
              loading: isCreating,
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Doc size={18} color="var(--refly-text-0)" />
                  {t('canvas.nodeActions.createAsDocument')}
                  {isCreating && <Spin size="small" className="ml-1 text-refly-text-3" />}
                </div>
              ),
              onClick: handleSaveAsDocument,
            },
            {
              key: 'share',
              disabled: !result || isSharing,
              loading: isSharing,
              label: (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Share size={18} color="var(--refly-text-0)" />
                  {t('common.share')}
                </div>
              ),
              onClick: handleShare,
            },
          ]),
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
              disabled: readonly,
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
  }, [
    handleDeleteNode,
    handleLocateNode,
    handleSaveAsDocument,
    handleShare,
    isSharing,
    latestStepContent,
    result,
    t,
    isCreating,
    readonly,
  ]);
  return (
    <div className="flex items-center gap-3">
      {!readonly && (
        <Tooltip title={t('canvas.nodeActions.rerun')}>
          <Button
            className="!h-5 !w-5 p-0"
            size="small"
            type="text"
            icon={<Reload size={16} />}
            onClick={handleReRun}
          />
        </Tooltip>
      )}

      <Dropdown
        menu={{ items: moreMenuItems }}
        trigger={['click']}
        placement="bottomRight"
        open={dropdownOpen}
        onOpenChange={(open, info: any) => {
          if (info?.source === 'menu') {
            setDropdownOpen(true);
            return;
          }
          setDropdownOpen(open);
        }}
      >
        <Tooltip title={t('canvas.nodeActions.more')} arrow={false}>
          <Button className="!h-5 !w-5 p-0" size="small" type="text" icon={<More size={16} />} />
        </Tooltip>
      </Dropdown>
    </div>
  );
};

SkillResponseTopButtons.displayName = 'SkillResponseTopButtons';
