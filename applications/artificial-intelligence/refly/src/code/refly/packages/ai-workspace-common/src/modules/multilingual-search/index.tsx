import { useEffect, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { SearchResults } from './components/search-results';
import { SearchActionMenu } from './components/search-action-menu';
import { SearchOptions } from './components/search-options';
import { useMultilingualSearchStoreShallow } from '@refly/stores';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import './index.scss';

const { Search: AntSearch } = Input;

interface MultilingualSearchProps {
  showResults?: boolean;
  setShowResults?: (showResults: boolean) => void;
}

function MultilingualSearch({ showResults, setShowResults }: MultilingualSearchProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isSearching,
    results,
    outputLocale,
    resetAll,
    query,
    searchLocales,
    setQuery,
    setProcessingStep,
    setIsSearching,
    addSearchStep,
    setResults,
    clearSelectedItems,
  } = useMultilingualSearchStoreShallow((state) => ({
    isSearching: state.isSearching,
    results: state.results,
    outputLocale: state.outputLocale,
    resetAll: state.resetAll,
    query: state.query,
    searchLocales: state.searchLocales,
    setQuery: state.setQuery,
    setSearchLocales: state.setSearchLocales,
    setOutputLocale: state.setOutputLocale,
    setProcessingStep: state.setProcessingStep,
    setIsSearching: state.setIsSearching,
    addSearchStep: state.addSearchStep,
    setResults: state.setResults,
    clearSelectedItems: state.clearSelectedItems,
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAll();
    };
  }, [resetAll]);

  // Show results when search is complete or results are available
  useEffect(() => {
    if (results?.length > 0 || isSearching) {
      setShowResults(true);
    }
  }, [results, isSearching]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Click was outside the component
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        setShowResults
      ) {
        setShowResults(false);
        clearSelectedItems(); // Clear selected items when closing
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showResults, setShowResults, clearSelectedItems]);

  const handleMultilingualSearch = async (userInput?: string) => {
    if (userInput?.trim()?.length === 0) return;

    setIsSearching(true);
    setProcessingStep();

    try {
      const { data } = await getClient().multiLingualWebSearch({
        body: {
          query: userInput,
          searchLocaleList: searchLocales.map((locale) => locale.code),
          displayLocale: outputLocale.code,
          enableRerank: true,
        },
      });

      // Update search steps and results from response
      if (data?.data?.searchSteps) {
        for (const step of data.data.searchSteps) {
          if (step.step === 'finish') {
            addSearchStep(step);
          } else {
            addSearchStep(step);
            setProcessingStep();
          }
        }
      }

      if (data?.data?.sources) {
        setResults(data.data.sources);
      }
    } catch (error) {
      console.error('Multilingual search failed:', error);
      setIsSearching(false);
    }
  };

  return (
    <div className="multilingual-search-container" ref={containerRef}>
      <div className="flex flex-col gap-1">
        <AntSearch
          placeholder={t('resource.multilingualSearch.placeholder')}
          value={query}
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleMultilingualSearch}
          enterButton={<SearchOutlined />}
        />
        <div className="relative w-full">
          {showResults && (
            <div className="absolute top-1 left-0 right-0 z-10 rounded-xl border-solid border-[1px] border-refly-Card-Border shadow-refly-m bg-refly-bg-content-z2 p-2">
              <div className="flex-1 overflow-y-auto max-h-[45vh] relative">
                <SearchResults
                  outputLocale={outputLocale}
                  config={{ enableTranslation: true, showCheckbox: true, showIndex: false }}
                />
              </div>
              <SearchActionMenu setShowResults={setShowResults} />
            </div>
          )}
        </div>
        <SearchOptions />
      </div>
    </div>
  );
}

export default MultilingualSearch;
