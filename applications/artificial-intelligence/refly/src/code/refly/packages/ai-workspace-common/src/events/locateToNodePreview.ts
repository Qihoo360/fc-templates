import mitt from 'mitt';

export type Events = {
  locateToNodePreview: {
    canvasId: string;
    id: string;
    type?: 'editResponse';
  };
};

export const locateToNodePreviewEmitter = mitt<Events>();
