import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { genImageID } from '@refly/utils/id';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useMemo } from 'react';
import { nodeOperationsEmitter } from '@refly-packages/ai-workspace-common/events/nodeOperations';
import { CanvasNodeData, ImageNodeMeta } from '@refly/canvas-common';

export const useUploadImage = () => {
  const { addNode } = useAddNode();

  const uploadImage = async (image: File, canvasId: string) => {
    const response = await getClient().upload({
      body: {
        file: image,
        entityId: canvasId,
        entityType: 'canvas',
      },
    });
    return response?.data;
  };

  const handleUploadImage = async (imageFile: File, canvasId: string) => {
    const result = await uploadImage(imageFile, canvasId);
    const { data, success } = result ?? {};
    if (success && data) {
      const nodeData = {
        title: imageFile.name,
        entityId: genImageID(),
        metadata: {
          imageUrl: data.url,
          storageKey: data.storageKey,
        } as ImageNodeMeta,
      };
      addNode({
        type: 'image',
        data: { ...nodeData },
      });
      return nodeData;
    }
    return null;
  };

  const handleUploadMultipleImages = async (imageFiles: File[], canvasId: string) => {
    // Store the reference position for node placement
    let referencePosition: { x: number; y: number } | null = null;
    const nodesData = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const result = await uploadImage(imageFile, canvasId);
      const { data, success } = result ?? {};

      if (success && data) {
        const nodeData: CanvasNodeData<ImageNodeMeta> = {
          title: imageFile.name ?? '',
          entityId: genImageID(),
          metadata: {
            imageUrl: data.url,
            storageKey: data.storageKey,
          },
        };

        await new Promise<void>((resolve) => {
          // Use the event emitter to add nodes with proper spacing
          nodeOperationsEmitter.emit('addNode', {
            node: {
              type: 'image',
              data: nodeData,
              position: referencePosition
                ? {
                    x: referencePosition.x,
                    y: referencePosition.y + 150, // Add vertical spacing between nodes
                  }
                : undefined,
            },
            shouldPreview: i === imageFiles.length - 1,
            needSetCenter: i === imageFiles.length - 1,
            positionCallback: (newPosition) => {
              referencePosition = newPosition;
              resolve();
            },
          });

          // Add a timeout in case the callback doesn't fire
          setTimeout(() => resolve(), 100);
        });

        nodesData.push(nodeData);
      }
    }

    return nodesData;
  };

  return useMemo(
    () => ({
      handleUploadImage,
      handleUploadMultipleImages,
    }),
    [],
  );
};
