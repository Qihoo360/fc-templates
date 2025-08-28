import {
  ArrowDownWideNarrow,
  CheckCheck,
  RefreshCcwDot,
  StepForward,
  WrapText,
} from 'lucide-react';
import { useEditor } from '../../../core/components';
import { getPrevText } from '../../../core/utils';
import { CommandGroup, CommandItem, CommandSeparator, CommandList } from '../../ui/command';

const options = [
  {
    value: 'improve',
    label: 'Improve writing',
    icon: RefreshCcwDot,
  },

  {
    value: 'fix',
    label: 'Fix grammar',
    icon: CheckCheck,
  },
  {
    value: 'shorter',
    label: 'Make shorter',
    icon: ArrowDownWideNarrow,
  },
  {
    value: 'longer',
    label: 'Make longer',
    icon: WrapText,
  },
  {
    value: 'explain',
    label: 'Explain selection',
    icon: WrapText,
  },
];

interface AISelectorCommandsProps {
  onSelect: (value: string, option: string) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
  const { editor } = useEditor();

  return (
    <>
      <CommandGroup heading="Edit or review selection">
        <CommandList>
          {options.map((option) => (
            <CommandItem
              onSelect={(value) => {
                const slice = editor.state.selection.content();
                const text = editor.storage.markdown.serializer.serialize(slice.content);
                onSelect(text, value);
              }}
              className="flex gap-2 px-4"
              key={option.value}
              value={option.value}
            >
              <option.icon className="w-4 h-4 text-primary-600" />
              {option.label}
            </CommandItem>
          ))}
        </CommandList>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Use AI to do more">
        <CommandList>
          <CommandItem
            onSelect={() => {
              const pos = editor.state.selection.from;

              const text = getPrevText(editor, pos);
              onSelect(text, 'continue');
            }}
            value="continue"
            className="gap-2 px-4"
          >
            <StepForward className="w-4 h-4 text-primary-600" />
            Continue writing
          </CommandItem>
        </CommandList>
      </CommandGroup>
    </>
  );
};

export default AISelectorCommands;
