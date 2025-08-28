import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { editorEmitter } from '@refly/utils/event-emitter/editor';

export const SpaceAICommand = Extension.create({
  name: 'space-ai-command',

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey('space-ai-command'),
      props: {
        handleKeyDown: (view, event) => {
          if (event.key !== ' ') return false;

          const { state } = view;
          const { selection, doc } = state;
          const { empty, from } = selection;

          const parentNode = doc.resolve(from).parent;

          const isEmptyParagraph =
            parentNode.type.name === 'paragraph' && parentNode.content.size === 0 && empty;

          if (isEmptyParagraph) {
            event.preventDefault();

            const docId = view.dom.closest('[data-doc-id]')?.getAttribute('data-doc-id');

            editorEmitter.emit('activeAskAI', { value: true, docId });

            return true;
          }

          return false;
        },
      },
    });

    return [plugin];
  },
});
