import mitt from 'mitt';

export type DeletedNodesEvents = {
  nodeDeleted: string; // entityId of the deleted node
};

export const deletedNodesEmitter = mitt<DeletedNodesEvents>();
