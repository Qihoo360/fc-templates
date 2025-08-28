import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@xyflow/react';
import { CanvasNode } from '@refly/canvas-common';
import { CanvasEdge } from '@refly/openapi-schema';

export const useRealtimeCanvasData = () => {
  const { nodes, edges, nodesSignature } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      // This signature forces re-render when node parent relationships change
      nodesSignature: Array.isArray(state.nodes)
        ? [...state.nodes]
            .map((n) => `${n?.id ?? ''}:${n?.type ?? ''}:${n?.parentId ?? ''}`)
            .sort()
            .join('|')
        : '',
    })),
  );

  return {
    nodes: nodes as CanvasNode[],
    edges: edges as CanvasEdge[],
    nodesSignature,
  };
};
