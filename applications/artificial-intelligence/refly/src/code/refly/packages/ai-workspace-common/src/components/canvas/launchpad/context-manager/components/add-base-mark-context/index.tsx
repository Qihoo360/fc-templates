import { useState } from 'react';
import { Badge, Button, Popover, Tooltip } from 'antd';
import { AddContext } from 'refly-icons';
import { BaseMarkContextSelector } from '../base-mark-context-selector';
import { useTranslation } from 'react-i18next';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { IContextItem } from '@refly/common-types';

interface AddBaseMarkContextProps {
  contextItems: IContextItem[];
  setContextItems: (items: IContextItem[]) => void;
}

export const AddBaseMarkContext = ({ contextItems, setContextItems }: AddBaseMarkContextProps) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const { t } = useTranslation();

  const handleVisibleChange = (visible: boolean) => {
    setPopoverVisible(visible);
  };

  const handleClose = () => {
    setPopoverVisible(false);
  };

  const handleSelect = (item: IContextItem) => {
    const isSelected = contextItems.find((contextItem) => contextItem.entityId === item.entityId);

    if (!isSelected) {
      // Adding node
      setContextItems([...contextItems, item]);
    } else {
      // Removing node
      setContextItems(contextItems.filter((contextItem) => contextItem.entityId !== item.entityId));
    }
  };

  const handleClear = () => {
    setContextItems([]);
  };

  return (
    <Badge
      count={(contextItems || []).length}
      size="small"
      color="#0E9F77"
      style={{ zIndex: 1000 }}
    >
      <Popover
        placement="bottom"
        trigger="click"
        styles={{ body: { padding: 0, boxShadow: 'none' } }}
        open={popoverVisible}
        onOpenChange={handleVisibleChange}
        content={
          <BaseMarkContextSelector
            onClose={handleClose}
            onSelect={handleSelect}
            selectedItems={contextItems}
            onClear={handleClear}
          />
        }
      >
        <Tooltip
          title={contextItems?.length > 0 ? t('knowledgeBase.context.addContext') : ''}
          getPopupContainer={getPopupContainer}
        >
          <Button
            size="small"
            type="default"
            className="text-xs h-5 gap-1 flex items-center justify-center px-1 box-border rounded-[4px] font-normal"
          >
            <AddContext size={16} color="var(--refly-text-0)" />
            {contextItems?.length === 0 ? t('knowledgeBase.context.addContext') : null}
          </Button>
        </Tooltip>
      </Popover>
    </Badge>
  );
};
