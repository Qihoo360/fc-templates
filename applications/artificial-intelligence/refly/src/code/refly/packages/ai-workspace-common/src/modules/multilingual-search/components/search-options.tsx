import { useMemo, useEffect } from 'react';
import { Select } from 'antd';
import { useMultilingualSearchStoreShallow } from '@refly/stores';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import {
  languageNameToLocale,
  localeToLanguageName,
} from '@refly-packages/ai-workspace-common/utils/i18n';

import './search-options.scss';

export const SearchOptions = () => {
  const { i18n, t } = useTranslation();
  const currentUiLocale = i18n.language as LOCALE;

  const multilingualSearchStore = useMultilingualSearchStoreShallow((state) => ({
    searchLocales: state.searchLocales,
    outputLocale: state.outputLocale,
    setSearchLocales: state.setSearchLocales,
    setOutputLocale: state.setOutputLocale,
  }));

  useEffect(() => {
    if (!multilingualSearchStore.outputLocale.code) {
      multilingualSearchStore.setOutputLocale({
        code: currentUiLocale,
        name: getLocaleName(currentUiLocale),
      });
    }
  }, [currentUiLocale]);

  const languageOptions = useMemo(() => {
    const languageMap =
      currentUiLocale === LOCALE.EN ? languageNameToLocale.en : languageNameToLocale['zh-CN'];

    return Object.entries(languageMap).map(([label, code]) => ({
      label,
      value: code,
    }));
  }, [currentUiLocale]);

  const outputLanguageOptions = useMemo(() => {
    return [...languageOptions];
  }, [languageOptions, currentUiLocale]);

  const getLocaleName = (locale: string) => {
    const names =
      currentUiLocale === LOCALE.EN ? localeToLanguageName.en : localeToLanguageName['zh-CN'];
    return names[locale] || locale;
  };

  // Keep selected codes memoized to support stable tag rendering
  const selectedCodes = useMemo(() => {
    return multilingualSearchStore.searchLocales?.map((l) => l.code) ?? [];
  }, [multilingualSearchStore.searchLocales]);

  const handleSearchLocalesChange = (values: string[]) => {
    const limitedValues = values.length > 3 ? [...values.slice(-3)] : values;

    const newLocales = limitedValues.map((code) => ({
      code,
      name: getLocaleName(code),
    }));
    multilingualSearchStore.setSearchLocales(newLocales);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 flex-1">
        <div className="text-refly-text-1 text-xs leading-4 whitespace-nowrap">
          {t('resource.multilingualSearch.searchLabel')}
        </div>
        <Select
          className="search-language-select min-w-[200px]"
          id="search-language-select"
          mode="multiple"
          variant="borderless"
          showSearch={false}
          placeholder={t('resource.multilingualSearch.selectSearchLanguages')}
          value={multilingualSearchStore.searchLocales.map((l) => l.code)}
          onChange={handleSearchLocalesChange}
          maxCount={3}
          maxTagCount="responsive"
          maxTagPlaceholder={() => {
            return <span className="text-refly-text-0 text-xs font-semibold">...</span>;
          }}
          options={languageOptions}
          labelRender={(label) => {
            return (
              <span className="text-refly-text-0 text-xs font-semibold">
                {label.label}
                {selectedCodes.indexOf(label.value as string) === selectedCodes.length - 1
                  ? ''
                  : '、'}
              </span>
            );
          }}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <div className="flex items-center gap-1 flex-1 justify-end">
        <div className="text-refly-text-1 text-xs leading-4 whitespace-nowrap">
          {t('resource.multilingualSearch.displayLabel')}
        </div>

        <Select
          className="search-language-select show-language-select min-w-[200px]"
          id="display-language-select"
          variant="borderless"
          showSearch={false}
          placeholder={t('resource.multilingualSearch.selectDisplayLanguage')}
          value={multilingualSearchStore.outputLocale.code}
          onChange={(value) => {
            multilingualSearchStore.setOutputLocale({
              code: value,
              name:
                value === 'auto'
                  ? currentUiLocale === LOCALE.EN
                    ? 'Auto'
                    : '自动'
                  : getLocaleName(value),
            });
          }}
          options={outputLanguageOptions}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>
    </div>
  );
};
