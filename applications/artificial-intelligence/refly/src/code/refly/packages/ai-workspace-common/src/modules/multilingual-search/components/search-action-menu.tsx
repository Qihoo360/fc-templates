import React from 'react';
import { Button, Checkbox, Divider, message } from 'antd';
import { useMultilingualSearchStore } from '@refly/stores';
import { useTranslation } from 'react-i18next';
import { useImportResourceStoreShallow } from '@refly/stores';
import { genUniqueId } from '@refly/utils/id';
import { safeParseURL } from '@refly/utils/url';

interface SearchActionMenuProps {
  setShowResults: (showResults: boolean) => void;
}

export const SearchActionMenu: React.FC<SearchActionMenuProps> = ({ setShowResults }) => {
  const { t } = useTranslation();

  const { selectedItems, results, setSelectedItems } = useMultilingualSearchStore();
  const { addToWaitingList } = useImportResourceStoreShallow((state) => ({
    addToWaitingList: state.addToWaitingList,
  }));

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? results : []);
  };

  const handleAddToWaitingList = () => {
    if (selectedItems.length === 0) {
      message.warning(t('resource.import.emptyLink'));
      return;
    }

    // Add selected items to waiting list
    for (const item of selectedItems) {
      const waitingItemId = genUniqueId();
      addToWaitingList({
        id: waitingItemId,
        type: 'weblink',
        title: item.title ?? '',
        url: item.url,
        status: 'pending',
        link: {
          key: waitingItemId,
          url: item.url,
          title: item.title ?? '',
          description: item.pageContent,
          image: `https://www.google.com/s2/favicons?domain=${safeParseURL(item.url)}&sz=16`,
          isHandled: true,
          isError: false,
        },
      });
    }

    message.success(t('resource.import.addedToWaitingList', { count: selectedItems.length }));
    setSelectedItems([]);
    setShowResults(false);
  };

  const handleClose = () => {
    setSelectedItems([]);
    setShowResults(false);
  };

  return (
    <div>
      <Divider className="my-3 !bg-refly-Card-Border" />
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedItems.length > 0 && selectedItems.length === results.length}
            indeterminate={selectedItems.length > 0 && selectedItems.length < results.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <div className="text-refly-text-1 text-xs leading-5">
            {t('resource.import.selectedCount', { count: selectedItems.length })}
          </div>
        </div>
        <div className="footer-action">
          <Button type="default" onClick={handleClose}>
            {t('common.close')}
          </Button>
          <Button
            type="default"
            onClick={handleAddToWaitingList}
            disabled={selectedItems.length === 0}
          >
            {t('resource.import.addToWaiting')}
          </Button>
        </div>
      </div>
    </div>
  );
};
