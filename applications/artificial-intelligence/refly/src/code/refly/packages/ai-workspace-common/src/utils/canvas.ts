import { CanvasNode } from '@refly/canvas-common';
import { Node } from '@xyflow/react';

// Define NodePreview type directly since it's not exported from canvas.ts
type NodePreviewData = {
  metadata?: Record<string, unknown>;
  [key: string]: any;
};

type NodePreview = CanvasNode<NodePreviewData> & {
  isPinned?: boolean;
};

/**
 * Utility function to get fresh node previews by merging preview data with the latest node data
 *
 * @param nodes - The actual canvas nodes with the latest data (can be CanvasNode or ReactFlow Node)
 * @param previews - The node previews that might contain stale data
 * @returns Updated node previews with fresh data from the nodes
 */
export const getFreshNodePreviews = (
  nodes: (CanvasNode<any> | Node)[] = [],
  previews: NodePreview[] = [],
): NodePreview[] => {
  // Create a map of node data by entityId for quick lookup
  const nodeDataMap = new Map();
  for (const node of nodes) {
    if (node.data?.entityId) {
      nodeDataMap.set(node.data.entityId, node);
    }
  }

  // Update previews with fresh data from nodes
  return previews.map((preview) => {
    const freshNode = nodeDataMap.get(preview.data?.entityId);
    if (freshNode && preview.data?.entityId) {
      // Return a new preview with updated data from the node
      return {
        ...preview,
        data: {
          ...preview.data,
          contentPreview: freshNode.data?.contentPreview ?? preview.data?.contentPreview,
          title: freshNode.data?.title ?? preview.data?.title,
          metadata: {
            ...preview.data?.metadata,
            ...freshNode.data?.metadata,
          },
        },
      };
    }
    return preview;
  });
};
