import { Popover } from 'antd';
import { useEditor } from '../../core/components';
import { useEffect, useRef } from 'react';
import Magic from '../ui/icons/magic';
import { Button } from 'antd';

interface AIBtnSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIBtnSelector = ({ open, onOpenChange }: AIBtnSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useEditor();

  // Autofocus on input by default
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!editor) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Button
        className="gap-1 rounded-none text-primary text-primary-600 px-2"
        type="text"
        onClick={() => onOpenChange(true)}
      >
        <Magic className="w-4 h-4" />
        Ask AI
      </Button>
      {/* {open && (
        <PopoverContent
          align="start"
          className="p-0 w-[350px]"
          sideOffset={10}
          onFocusOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <AISelector open={open} onOpenChange={onOpenChange} />
        </PopoverContent>
      )} */}
    </Popover>
  );
};
