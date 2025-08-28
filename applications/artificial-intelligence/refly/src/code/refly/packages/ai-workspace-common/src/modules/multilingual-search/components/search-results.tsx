import React from 'react';
import { Skeleton, Empty } from 'antd';
import { useMultilingualSearchStoreShallow } from '@refly/stores';
import { useTranslation } from 'react-i18next';
import './search-results.scss';
import { SearchResultItem } from './search-result-item';
import { SearchLocale } from '@refly/common-types';
import { Source } from '@refly/openapi-schema';
import cn from 'classnames';

interface SearchResultsProps {
  className?: string;
  outputLocale: SearchLocale;
  config?: {
    showCheckbox?: boolean;
    startIndex?: number;
    showIndex?: boolean;
    handleItemClick?: (item: Source) => void;
    enableTranslation?: boolean;
  };
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  className,
  outputLocale,
  config = {
    showCheckbox: true,
    startIndex: 1,
    showIndex: false,
    handleItemClick: (item) => window.open(item.url, '_blank'),
    enableTranslation: false,
  },
}) => {
  const { t, i18n } = useTranslation();
  const currentUiLocale = i18n.language as 'en' | 'zh-CN';
  const { results, selectedItems, toggleSelectedItem, isSearching } =
    useMultilingualSearchStoreShallow((state) => ({
      results: state.results,
      selectedItems: state.selectedItems,
      toggleSelectedItem: state.toggleSelectedItem,
      isSearching: state.isSearching,
    }));

  const renderSkeletonItem = () => <Skeleton title={false} paragraph={{ rows: 3 }} active />;

  return (
    <div className={cn('w-full', className)}>
      {isSearching ? (
        <div className="w-full flex flex-col gap-3 p-2">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>{renderSkeletonItem()}</React.Fragment>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="w-full flex flex-col gap-3 p-2">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-refly-text-3">
                {t('resource.multilingualSearch.noResults')}
              </span>
            }
          />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-1">
          {results.map((item, index) => (
            <SearchResultItem
              key={index}
              item={item}
              index={index}
              outputLocale={outputLocale}
              selectedItems={selectedItems}
              toggleSelectedItem={toggleSelectedItem}
              config={config}
              currentUiLocale={currentUiLocale}
            />
          ))}
        </div>
      )}
    </div>
  );
};
