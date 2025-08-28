import { FC, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { SelectionActionMenu } from '../multi-selection-menu/selection-action-menu';

interface SelectionContextMenuProps {
  open: boolean;
  position: { x: number; y: number };
  setOpen: (open: boolean) => void;
}

export const SelectionContextMenu: FC<SelectionContextMenuProps> = ({
  open,
  position,
  setOpen,
}) => {
  const reactFlowInstance = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999]"
      style={{
        left: `${reactFlowInstance.flowToScreenPosition(position).x}px`,
        top: `${reactFlowInstance.flowToScreenPosition(position).y}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <SelectionActionMenu onClose={() => setOpen(false)} />
    </div>
  );
};
