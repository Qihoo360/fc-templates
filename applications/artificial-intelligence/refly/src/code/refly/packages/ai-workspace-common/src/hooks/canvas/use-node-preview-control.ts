import { useCallback, useEffect } from 'react';
import {
  useCanvasResourcesPanelStoreShallow,
  useActiveNode,
  useCanvasStore,
  useCanvasStoreShallow,
} from '@refly/stores';
import { CanvasNode } from '@refly/canvas-common';
import { locateToNodePreviewEmitter } from '@refly-packages/ai-workspace-common/events/locateToNodePreview';
import { useReactFlow } from '@xyflow/react';
import { useNodeSelection } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-selection';

interface UseNodePreviewControlOptions {
  canvasId: string;
}

interface NodePreviewControl {
  clickToPreview: boolean;
  nodePreviews: CanvasNode[];
  toggleClickToPreview: () => void;
  previewNode: (node: CanvasNode) => void;
  closeNodePreview: (node: CanvasNode) => void;
  closeNodePreviewByEntityId: (entityId: string) => void;
  pinNode: (node: CanvasNode) => void;
  unpinNode: (node: CanvasNode) => void;
  isNodePinned: (nodeId: string) => boolean;
  clearPinnedNodes: () => void;
  handleNodePreview: (node: CanvasNode) => boolean;
}

export const useNodePreviewControl = ({
  canvasId,
}: UseNodePreviewControlOptions): NodePreviewControl => {
  const { getNodes } = useReactFlow();
  const { setSelectedNode } = useNodeSelection();
  const {
    clickToPreview,
    setClickToPreview,
    addNodePreview,
    setNodePreview,
    removeNodePreview,
    nodePreviews,
    canvasInitialized,
  } = useCanvasStoreShallow((state) => ({
    clickToPreview: state.clickToPreview,
    setClickToPreview: state.setClickToPreview,
    addNodePreview: state.addNodePreview,
    setNodePreview: state.setNodePreview,
    removeNodePreview: state.removeNodePreview,
    nodePreviews: state.config[canvasId]?.nodePreviews || [],
    canvasInitialized: state.canvasInitialized[canvasId],
  }));
  const { setActiveNode } = useActiveNode(canvasId);
  const { setSidePanelVisible } = useCanvasResourcesPanelStoreShallow((state) => ({
    setSidePanelVisible: state.setSidePanelVisible,
  }));

  // Cleanup non-existent node previews
  useEffect(() => {
    if (!nodePreviews?.length) return;
    if (!canvasInitialized) return;

    setTimeout(() => {
      const nodes = getNodes();
      const canvasNodeIds = new Set(nodes.map((node) => node.id));
      for (const preview of nodePreviews) {
        if (!canvasNodeIds.has(preview.id)) {
          removeNodePreview(canvasId, preview.id);
        }
      }
    }, 1000);
  }, [canvasId, canvasInitialized, nodePreviews, removeNodePreview]);

  /**
   * Toggle click-to-preview functionality
   */
  const toggleClickToPreview = useCallback(() => {
    setClickToPreview(!clickToPreview);
  }, [clickToPreview, setClickToPreview]);

  /**
   * Pin a node for preview
   */
  const previewNode = useCallback(
    (node: CanvasNode) => {
      addNodePreview(canvasId, node);
      setSelectedNode(node);
      setActiveNode(node);
      setSidePanelVisible(true);
    },
    [canvasId, addNodePreview, setSelectedNode, setActiveNode, setSidePanelVisible],
  );

  const closeNodePreview = useCallback(
    (node: CanvasNode) => {
      removeNodePreview(canvasId, node.id);
    },
    [canvasId, removeNodePreview],
  );

  const closeNodePreviewByEntityId = useCallback(
    (entityId: string) => {
      const { config } = useCanvasStore.getState();
      const nodePreviews = config[canvasId]?.nodePreviews || [];
      const node = nodePreviews.find((node) => node.data?.entityId === entityId);
      if (node) {
        removeNodePreview(canvasId, node.id);
      }
    },
    [canvasId, removeNodePreview],
  );

  const pinNode = useCallback(
    (node: CanvasNode) => {
      setNodePreview(canvasId, { ...node, isPinned: true });
    },
    [canvasId, setNodePreview],
  );

  /**
   * Unpin a node from preview
   */
  const unpinNode = useCallback(
    (node: CanvasNode) => {
      setNodePreview(canvasId, { ...node, isPinned: false });
    },
    [canvasId, setNodePreview],
  );

  /**
   * Check if a node is pinned
   */
  const isNodePinned = useCallback(
    (nodeId: string) => {
      const { config } = useCanvasStore.getState();
      const nodePreviews = config[canvasId]?.nodePreviews || [];
      return nodePreviews.some((n) => n.id === nodeId && n.isPinned);
    },
    [canvasId],
  );

  /**
   * Clear all pinned nodes
   */
  const clearPinnedNodes = useCallback(() => {
    for (const node of nodePreviews) {
      removeNodePreview(canvasId, node.id);
    }
  }, [canvasId, nodePreviews, removeNodePreview]);

  /**
   * Handle node click with preview logic
   */
  const handleNodePreview = useCallback(
    (node: CanvasNode) => {
      if (!clickToPreview) {
        return false;
      }
      addNodePreview(canvasId, node);
      setActiveNode(node);
      setSidePanelVisible(true);
      setSelectedNode(node);
      locateToNodePreviewEmitter.emit('locateToNodePreview', { canvasId, id: node.id });
      return true;
    },
    [canvasId, clickToPreview, addNodePreview, setSelectedNode, setActiveNode, setSidePanelVisible],
  );

  return {
    // State
    clickToPreview,
    nodePreviews,

    // Actions
    toggleClickToPreview,
    previewNode,
    closeNodePreview,
    closeNodePreviewByEntityId,
    pinNode,
    unpinNode,
    isNodePinned,
    clearPinnedNodes,
    handleNodePreview,
  };
};
