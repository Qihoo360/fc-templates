import { useCallback } from 'react';
import { useSetNodeDataByEntity } from '@refly-packages/ai-workspace-common/hooks/canvas/use-set-node-data-by-entity';
import { useActiveNode } from '@refly/stores';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { CanvasNodeType } from '@refly/openapi-schema';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
import { useGetProjectCanvasId } from '@refly-packages/ai-workspace-common/hooks/use-get-project-canvasId';
import { useSiderStoreShallow } from '@refly/stores';

export const useUpdateNodeTitle = () => {
  const { projectId } = useGetProjectCanvasId();
  const { canvasId } = useCanvasContext();

  const { sourceList, setSourceList } = useSiderStoreShallow((state) => ({
    sourceList: state.sourceList,
    setSourceList: state.setSourceList,
  }));

  const { activeNode, setActiveNode } = useActiveNode(canvasId);

  const setNodeDataByEntity = useSetNodeDataByEntity();

  const handleTitleUpdate = useCallback(
    (newTitle: string, entityId: string, nodeId: string, nodeType: CanvasNodeType) => {
      const preview = activeNode?.id === nodeId ? activeNode : null;

      if (preview) {
        setActiveNode({
          ...preview,
          data: {
            ...preview.data,
            title: newTitle,
          },
        });
      }

      setNodeDataByEntity(
        {
          entityId: entityId,
          type: nodeType,
        },
        {
          title: newTitle,
        },
      );

      if (nodeType === 'document') {
        editorEmitter.emit('syncDocumentTitle', { docId: entityId, title: newTitle });
      }

      if (nodeType === 'document' && projectId) {
        const source = sourceList.find((s) => s.id === entityId);
        if (source) {
          setSourceList(sourceList.map((s) => (s.id === entityId ? { ...s, title: newTitle } : s)));
        }
      }
    },
    [
      setNodeDataByEntity,
      canvasId,
      sourceList,
      setSourceList,
      projectId,
      activeNode,
      setActiveNode,
    ],
  );

  return handleTitleUpdate;
};
