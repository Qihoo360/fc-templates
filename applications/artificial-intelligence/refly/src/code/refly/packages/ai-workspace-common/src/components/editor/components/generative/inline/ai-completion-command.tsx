import { CommandGroup, CommandItem, CommandList, CommandSeparator } from '../../ui/command';
import { useEditor } from '../../../core/components';
import { editorEmitter } from '@refly/utils/event-emitter/editor';
import { Check, TextQuote, TrashIcon } from 'lucide-react';

const AICompletionCommands = ({
  completion,
  onDiscard,
}: {
  completion: string;
  onDiscard: () => void;
}) => {
  const { editor } = useEditor();
  const docId = editor?.options?.editorProps?.attributes?.['data-doc-id'];

  return (
    <>
      <CommandGroup>
        <CommandList>
          <CommandItem
            className="gap-2 px-4"
            value="replace"
            onSelect={() => {
              if (!editor) return;

              const selection = editor.view?.state?.selection;

              if (selection) {
                editor
                  .chain()
                  .focus()
                  // .unsetAIHighlight()
                  .insertContentAt(
                    {
                      from: selection.from,
                      to: selection.to,
                    },
                    completion,
                  )
                  .run();
                editorEmitter.emit('activeAskAI', { value: false, docId });
              }
            }}
          >
            <Check className="w-4 h-4 text-muted-foreground" />
            Replace selection
          </CommandItem>
          <CommandItem
            className="gap-2 px-4"
            value="insert"
            onSelect={() => {
              if (!editor) return;

              const selection = editor.view?.state?.selection;

              if (selection) {
                editor
                  .chain()
                  .focus()
                  .insertContentAt(selection.to + 1, completion)
                  .run();

                editorEmitter.emit('activeAskAI', { value: false, docId });
              }
            }}
          >
            <TextQuote className="w-4 h-4 text-muted-foreground" />
            Insert below
          </CommandItem>
        </CommandList>
      </CommandGroup>
      <CommandSeparator />

      <CommandGroup>
        <CommandList>
          <CommandItem onSelect={onDiscard} value="thrash" className="gap-2 px-4">
            <TrashIcon className="w-4 h-4 text-muted-foreground" />
            Discard
          </CommandItem>
        </CommandList>
      </CommandGroup>
    </>
  );
};

export default AICompletionCommands;
