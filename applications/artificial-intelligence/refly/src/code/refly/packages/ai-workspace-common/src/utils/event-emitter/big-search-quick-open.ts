import mitt from 'mitt';

type Events = {
  openSearch: boolean;
  closeSearch: boolean;
};

export type EditorOperation = 'openSearch' | 'closeSearch';

export const bigSearchQuickOpenEmitter = mitt<Events>();
