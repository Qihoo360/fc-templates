import React from 'react';
import { Tag, Checkbox } from 'antd';
import { Source } from '@refly/openapi-schema';
import { TranslationWrapper } from '@refly-packages/ai-workspace-common/components/translation-wrapper';
import { SearchLocale, defaultLocalesMap } from '@refly/common-types';
import { safeParseURL } from '@refly/utils/url';
import { Language, Websearch } from 'refly-icons';
interface SearchResultItemProps {
  item: Source;
  index: number;
  outputLocale: SearchLocale;
  selectedItems: Source[];
  toggleSelectedItem: (item: Source, checked: boolean) => void;
  config: {
    showCheckbox?: boolean;
    startIndex?: number;
    showIndex?: boolean;
    enableTranslation?: boolean;
  };
  currentUiLocale: 'en' | 'zh-CN';
}

const SearchResultItem: React.FC<SearchResultItemProps> = React.memo(
  ({
    item,
    index: _index,
    outputLocale,
    selectedItems,
    toggleSelectedItem,
    config,
    currentUiLocale,
  }) => {
    const getLocaleName = (localeCode: string) => {
      const localeList = defaultLocalesMap[currentUiLocale];
      return localeList.find((locale) => locale.code === localeCode)?.name || localeCode;
    };

    const handleItemClick = () => {
      // Toggle item selection when clicked
      const isCurrentlySelected = selectedItems.includes(item);
      toggleSelectedItem(item, !isCurrentlySelected);
    };

    return (
      <div
        className={`w-full flex gap-3 p-2 items-start rounded-xl hover:bg-refly-tertiary-hover ${selectedItems.includes(item) ? 'bg-refly-bg-control-z0' : ''}`}
      >
        {config.showCheckbox && (
          <Checkbox
            checked={selectedItems.includes(item)}
            onChange={(e) => toggleSelectedItem(item, e.target.checked)}
          />
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-1" onClick={handleItemClick}>
          <TranslationWrapper
            className="text-refly-text-0 text-sm font-semibold truncate"
            content={item.title || ''}
            targetLanguage={
              outputLocale.code === 'auto'
                ? item.metadata?.translatedDisplayLocale || 'en'
                : outputLocale.code
            }
            originalLocale={item.metadata?.originalLocale || 'en'}
            enableTranslation={config.enableTranslation}
          />

          {/* Second row: Content with ellipsis */}
          <TranslationWrapper
            className="text-refly-text-1 text-sm truncate"
            content={item.pageContent}
            targetLanguage={
              outputLocale.code === 'auto'
                ? item.metadata?.translatedDisplayLocale || 'en'
                : outputLocale.code
            }
            originalLocale={item.metadata?.originalLocale || 'en'}
            enableTranslation={config.enableTranslation}
          />

          <div className="flex items-center gap-1 min-w-0">
            {item?.url && (
              <>
                <img
                  className="site-icon w-4 h-4 rounded"
                  src={`https://www.google.com/s2/favicons?domain=${safeParseURL(item.url)}&sz=16`}
                  alt=""
                />
                <a
                  className="flex-1 min-w-0 text-[10px] text-refly-text-1 truncate hover:text-refly-text-2"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.url}
                </a>
              </>
            )}
            {item.metadata?.translatedDisplayLocale && (
              <Tag className="text-[10px] flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Websearch size={12} /> {getLocaleName(item.metadata?.originalLocale || 'en')}
                </div>
                →
                <div className="flex items-center gap-0.5">
                  <Language size={12} />
                  {getLocaleName(item.metadata?.translatedDisplayLocale || 'en')}
                </div>
              </Tag>
            )}
          </div>
        </div>
      </div>
    );
  },
);

SearchResultItem.displayName = 'SearchResultItem';

export { SearchResultItem };
