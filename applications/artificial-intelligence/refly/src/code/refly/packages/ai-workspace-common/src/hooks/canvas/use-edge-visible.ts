import { useCallback } from 'react';
import { useCanvasStoreShallow } from '@refly/stores';
import { useEdgeOperations } from '@refly-packages/ai-workspace-common/hooks/canvas/use-edge-operations';

export const useEdgeVisible = () => {
  const { showEdges, setShowEdges } = useCanvasStoreShallow((state) => ({
    showEdges: state.showEdges,
    setShowEdges: state.setShowEdges,
  }));
  const { updateAllEdgesStyle } = useEdgeOperations();

  const toggleEdgeVisible = useCallback(() => {
    setShowEdges(!showEdges);
    updateAllEdgesStyle(!showEdges);
  }, [showEdges, setShowEdges, updateAllEdgesStyle]);

  return {
    showEdges,
    toggleEdgeVisible,
  };
};
