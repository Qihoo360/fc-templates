import { useCallback, useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  nodeOperationsEmitter,
  Events,
} from '@refly-packages/ai-workspace-common/events/nodeOperations';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';
import { useAddNode } from './use-add-node';
import { CanvasNode, CanvasNodeFilter, MediaSkillResponseNodeMeta } from '@refly/canvas-common';
import { CodeArtifactNodeMeta } from '@refly/canvas-common';
import { useNodePreviewControl } from '@refly-packages/ai-workspace-common/hooks/canvas/use-node-preview-control';
import { CanvasNodeType } from '@refly-packages/ai-workspace-common/requests';
import { useReactFlow } from '@xyflow/react';
import { locateToNodePreviewEmitter } from '@refly-packages/ai-workspace-common/events/locateToNodePreview';
import { genMediaSkillResponseID, genMediaSkillID } from '@refly/utils/id';
import { useChatStore, useChatStoreShallow } from '@refly/stores';

import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { omit } from '@refly/utils/typesafe';

export const useListenNodeOperationEvents = () => {
  const { readonly, canvasId } = useCanvasContext();
  const { addNode } = useAddNode();
  const { getNodes, getEdges, getNode } = useReactFlow();
  const { t } = useTranslation();

  // Only use canvas store if in interactive mode and not readonly
  const { previewNode, closeNodePreviewByEntityId } = useNodePreviewControl({ canvasId });

  // Get mediaSelectedModel from store for new mediaSkill nodes
  const { mediaSelectedModel } = useChatStoreShallow((state) => ({
    mediaSelectedModel: state.mediaSelectedModel,
  }));

  const queryCodeArtifactByResultId = useCallback(
    async (params: { resultId: string; resultVersion: number }) => {
      const { resultId, resultVersion } = params;
      const response = await getClient().listCodeArtifacts({
        query: {
          resultId,
          resultVersion,
          needContent: true,
          page: 1,
          pageSize: 1,
        },
      });

      return response?.data?.data?.[0];
    },
    [],
  );

  const jumpToDescendantNode = useCallback(
    async (entityId: string, descendantNodeType: CanvasNodeType, shouldPreview?: boolean) => {
      const nodes = getNodes() as CanvasNode[];
      const thisNode = nodes.find((node) => node.data?.entityId === entityId);

      if (!thisNode) return [false, null];

      // Find the descendant nodes that are code artifacts and pick the latest one
      const edges = getEdges();
      const descendantNodeIds = edges
        .filter((edge) => edge.source === thisNode.id)
        .map((edge) => edge.target);
      const descendantNodes = nodes
        .filter((node) => descendantNodeIds.includes(node.id))
        .filter((node) => node.type === descendantNodeType)
        .sort(
          (a, b) =>
            new Date(b.data.createdAt ?? '').getTime() - new Date(a.data.createdAt ?? '').getTime(),
        );
      let artifactNode: CanvasNode<CodeArtifactNodeMeta> | null = descendantNodes[0] || null;
      let nodeIdForEvent: string | undefined; // Track the node ID to use in the locate event

      // If artifactNode doesn't exist, try to fetch it from API
      if (!artifactNode && descendantNodeType === 'codeArtifact') {
        message.open({
          type: 'loading',
          content: t('artifact.loading'),
        });

        try {
          const artifactData = await queryCodeArtifactByResultId({
            resultId: entityId,
            resultVersion: Number(thisNode.data?.metadata?.version ?? 0),
          });
          message.destroy();

          if (artifactData) {
            // Create a new codeArtifact node with the fetched data
            const newNodeData = {
              type: 'codeArtifact' as const,
              data: {
                title: artifactData.title || t('canvas.nodeTypes.codeArtifact', 'Code Artifact'),
                entityId: artifactData.artifactId,
                contentPreview: artifactData.content,
                metadata: {
                  status: 'finish' as const,
                  language: artifactData.language || 'typescript',
                  type: artifactData.type || 'text/html',
                  activeTab: 'preview' as const,
                },
              },
            };

            // Add the node to canvas and connect to the parent node
            addNode(
              newNodeData,
              [{ type: thisNode.type as CanvasNodeType, entityId: thisNode.data.entityId }],
              false,
              false,
            );

            // Find the newly created node
            const updatedNodes = getNodes() as CanvasNode[];
            artifactNode = updatedNodes.find(
              (node) =>
                node.data?.entityId === artifactData.artifactId && node.type === 'codeArtifact',
            ) as CanvasNode<CodeArtifactNodeMeta> | null;

            if (artifactNode) {
              nodeIdForEvent = artifactNode.id;
            }
          } else {
            // API call succeeded but no data returned
            message.error(t('artifact.componentNotFound', 'Current component does not exist'));
            return [false, null];
          }
        } catch (error) {
          // API call failed
          console.error('Failed to fetch code artifact detail:', error);
          message.error(t('artifact.componentNotFound', 'Current component does not exist'));
          return [false, null];
        }
      }

      if (artifactNode && shouldPreview) {
        // Use the existing node's information for the preview
        nodeIdForEvent = artifactNode.id;
        previewNode(artifactNode as unknown as CanvasNode);
      }

      if (nodeIdForEvent) {
        // Emit the locate event with the correct node ID
        locateToNodePreviewEmitter.emit('locateToNodePreview', { canvasId, id: nodeIdForEvent });
      }
    },
    [getNodes, getEdges, previewNode, canvasId, addNode, t],
  );

  const handleGenerateMedia = useCallback(
    async ({
      providerItemId,
      mediaType,
      query,
      model,
      nodeId,
      targetType,
      targetId,
    }: Events['generateMedia']) => {
      if (readonly) return;

      let targetNodeId = nodeId;
      const { mediaSelectedModel } = useChatStore.getState();

      try {
        // If nodeId is empty, create a mediaSkill node first
        if (!targetNodeId) {
          const mediaSkillEntityId = genMediaSkillID();

          const mediaSkillNode = {
            type: 'mediaSkill' as const,
            data: {
              title: query,
              entityId: mediaSkillEntityId,
              metadata: {
                query,
                selectedModel: omit(mediaSelectedModel, ['creditBilling', 'provider']),
              },
            },
          };

          // Add the mediaSkill node to canvas
          addNode(mediaSkillNode, [], false, true);

          // Get the created node ID
          const nodes = getNodes();
          const createdNode = nodes?.find((node) => node.data?.entityId === mediaSkillEntityId);
          if (createdNode) {
            targetNodeId = createdNode.id;
          }
        }

        const { data } = await getClient().generateMedia({
          body: {
            prompt: query,
            mediaType,
            model,
            providerItemId,
            targetType,
            targetId,
          },
        });

        if (data?.success && data?.resultId) {
          // Create MediaSkillResponse node
          const resultId = data.resultId;
          const entityId = genMediaSkillResponseID();

          const newNode: Partial<CanvasNode<MediaSkillResponseNodeMeta>> = {
            type: 'mediaSkillResponse' as const,
            data: {
              title: query,
              entityId,
              metadata: {
                status: 'waiting' as const,
                mediaType,
                prompt: query,
                resultId,
                selectedModel: omit(mediaSelectedModel, ['creditBilling', 'provider']),
              },
            },
          };

          const currentNode = getNode(targetNodeId);
          const connectedTo: CanvasNodeFilter[] = currentNode
            ? [
                {
                  type: 'mediaSkill',
                  entityId: currentNode.data?.entityId as string,
                  handleType: 'source',
                },
              ]
            : [];

          addNode(newNode, connectedTo, false, true);

          // Emit completion event to notify mediaSkill node
          nodeOperationsEmitter.emit('mediaGenerationComplete', {
            nodeId: targetNodeId,
            success: true,
          });
        } else {
          console.error('Failed to generate media', data);

          // Emit completion event with error
          nodeOperationsEmitter.emit('mediaGenerationComplete', {
            nodeId: targetNodeId,
            success: false,
            error: 'Failed to generate media',
          });
        }
      } catch (error) {
        console.error('Failed to generate media', error);

        // Emit completion event with error
        nodeOperationsEmitter.emit('mediaGenerationComplete', {
          nodeId: targetNodeId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [readonly, getNode, addNode, getNodes, mediaSelectedModel],
  );

  useEffect(() => {
    const handleAddNode = (event: Events['addNode']) => {
      if (readonly) return;

      // Add the node and get the calculated position
      const position = addNode(
        event.node,
        event.connectTo,
        event.shouldPreview,
        event.needSetCenter,
      );

      // If a position callback was provided and we have a position, call it
      if (event.positionCallback && typeof event.positionCallback === 'function' && position) {
        event.positionCallback(position);
      }
    };

    const handleJumpToNode = (event: Events['jumpToDescendantNode']) => {
      if (readonly) return;
      jumpToDescendantNode(event.entityId, event.descendantNodeType, event.shouldPreview);
    };

    const handleCloseNodePreviewByEntityId = (event: Events['closeNodePreviewByEntityId']) => {
      if (readonly) return;
      closeNodePreviewByEntityId(event.entityId);
    };

    nodeOperationsEmitter.on('addNode', handleAddNode);
    nodeOperationsEmitter.on('jumpToDescendantNode', handleJumpToNode);
    nodeOperationsEmitter.on('closeNodePreviewByEntityId', handleCloseNodePreviewByEntityId);
    nodeOperationsEmitter.on('generateMedia', handleGenerateMedia);

    return () => {
      nodeOperationsEmitter.off('addNode', handleAddNode);
      nodeOperationsEmitter.off('jumpToDescendantNode', handleJumpToNode);
      nodeOperationsEmitter.off('closeNodePreviewByEntityId', handleCloseNodePreviewByEntityId);
      nodeOperationsEmitter.off('generateMedia', handleGenerateMedia);
    };
  }, [
    addNode,
    readonly,
    previewNode,
    closeNodePreviewByEntityId,
    jumpToDescendantNode,
    handleGenerateMedia,
  ]);
};
