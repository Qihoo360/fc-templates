import { useTranslation } from 'react-i18next';
import { message, Select, Button } from 'antd';
import { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { ProviderModal } from '../model-providers/provider-modal';
import { useListProviders } from '@refly-packages/ai-workspace-common/queries';
import { ProviderInfo, providerInfoList } from '@refly/utils';
import { useUserStoreShallow } from '@refly/stores';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { ProviderConfig, Provider } from '@refly/openapi-schema';
import { IconPlus } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';
import { ContentHeader } from '@refly-packages/ai-workspace-common/components/settings/contentHeader';

type ParserCategory = 'webSearch' | 'urlParsing' | 'pdfParsing';

const DEFAULT_PROVIDERS = {
  webSearch: undefined,
  urlParsing: 'cheerio',
  pdfParsing: 'pdfjs',
};

interface ParserConfigProps {
  visible: boolean;
}

interface ConfigCardProps {
  title: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  type: ParserCategory;
  onSelect: (value: string, type: ParserCategory) => void;
  renderDropdown: (menu: React.ReactNode, type: ParserCategory) => React.ReactElement;
}

const ConfigCard = memo(
  ({ title, value, options, type, onSelect, renderDropdown }: ConfigCardProps) => {
    const { t } = useTranslation();

    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-refly-text-0 font-semibold leading-5">{title}</div>
        <Select
          className="w-full"
          value={value}
          placeholder={t('settings.parserConfig.settingPlaceholder')}
          options={options}
          onChange={(value) => onSelect(value, type)}
          popupRender={(menu) => renderDropdown(menu, type)}
          size="middle"
        />
      </div>
    );
  },
);

export const Loading = memo(() => {
  return (
    <div className="w-full h-20 flex items-center justify-center">
      <Spin />
    </div>
  );
});

export const ParserConfig = memo(({ visible }: ParserConfigProps) => {
  const { t } = useTranslation();
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [presetProviders, setPresetProviders] = useState<ProviderInfo[]>([]);
  const [currentType, setCurrentType] = useState<ParserCategory>('webSearch');
  const { userProfile, setUserProfile } = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
    setUserProfile: state.setUserProfile,
  }));

  const { data, isLoading, refetch } = useListProviders({
    query: {
      enabled: true,
    },
  });
  const providers = data?.data || [];

  const webSearchProviders = useMemo(
    () => providers?.filter((provider) => provider.categories?.includes('webSearch')),
    [providers],
  );

  const urlParsingProviders = useMemo(
    () => providers?.filter((provider) => provider.categories?.includes('urlParsing')),
    [providers],
  );

  const pdfParsingProviders = useMemo(
    () => providers?.filter((provider) => provider.categories?.includes('pdfParsing')),
    [providers],
  );

  // Derive provider values from userProfile and available providers
  const defaultWebSearchValue = useMemo(
    () =>
      userProfile?.preferences?.webSearch?.providerId ||
      (webSearchProviders?.length > 0 ? webSearchProviders[0]?.providerId : undefined),
    [userProfile?.preferences?.webSearch?.providerId, webSearchProviders],
  );

  const defaultUrlParsingValue = useMemo(
    () =>
      userProfile?.preferences?.urlParsing?.providerId ||
      (urlParsingProviders?.length > 0
        ? urlParsingProviders[0]?.providerId
        : DEFAULT_PROVIDERS.urlParsing),
    [userProfile?.preferences?.urlParsing?.providerId, urlParsingProviders],
  );

  const defaultPdfParsingValue = useMemo(
    () =>
      userProfile?.preferences?.pdfParsing?.providerId ||
      (pdfParsingProviders?.length > 0
        ? pdfParsingProviders[0]?.providerId
        : DEFAULT_PROVIDERS.pdfParsing),
    [userProfile?.preferences?.pdfParsing?.providerId, pdfParsingProviders],
  );

  const [webSearchValue, setWebSearchValue] = useState<string | undefined>(defaultWebSearchValue);
  const [urlParsingValue, setUrlParsingValue] = useState<string>(defaultUrlParsingValue);
  const [pdfParsingValue, setPdfParsingValue] = useState<string>(defaultPdfParsingValue);

  // Update state values when derived values change
  useEffect(() => {
    if (defaultWebSearchValue) {
      setWebSearchValue(defaultWebSearchValue);
    }
  }, [defaultWebSearchValue]);

  useEffect(() => {
    if (defaultUrlParsingValue) {
      setUrlParsingValue(defaultUrlParsingValue);
    }
  }, [defaultUrlParsingValue]);

  useEffect(() => {
    if (defaultPdfParsingValue) {
      setPdfParsingValue(defaultPdfParsingValue);
    }
  }, [defaultPdfParsingValue]);

  const setCurrentProvider = useCallback((type: ParserCategory, provider: ProviderConfig) => {
    const providerId = provider?.providerId;
    switch (type) {
      case 'webSearch':
        setWebSearchValue(providerId || DEFAULT_PROVIDERS.webSearch);
        break;
      case 'urlParsing':
        setUrlParsingValue(providerId || DEFAULT_PROVIDERS.urlParsing);
        break;
      case 'pdfParsing':
        setPdfParsingValue(providerId || DEFAULT_PROVIDERS.pdfParsing);
        break;
    }
  }, []);

  const openProviderModal = useCallback((type: ParserCategory) => {
    setCurrentType(type);
    const filteredProviderInfoList = providerInfoList.filter((provider) =>
      provider?.categories?.includes(type),
    );
    setPresetProviders(filteredProviderInfoList);

    setIsProviderModalOpen(true);
  }, []);

  const handleProviderModalClose = useCallback(() => {
    setCurrentType('webSearch');
    setIsProviderModalOpen(false);
  }, []);

  const updateUserProfile = useCallback(
    async (type: ParserCategory, value: ProviderConfig, afterSuccess?: () => void) => {
      const updatedPreferences = {
        ...userProfile?.preferences,
        [type]: {
          ...value,
        },
      };

      const res = await getClient().updateSettings({
        body: {
          preferences: updatedPreferences,
        },
      });

      if (res?.data?.success) {
        message.success(t('settings.parserConfig.updateConfigSuccessfully'));
        setCurrentProvider(type, value);
        setUserProfile({
          ...userProfile!,
          preferences: updatedPreferences,
        });
        if (afterSuccess) {
          afterSuccess();
        }
      } else {
        message.error(t('settings.parserConfig.updateConfigFailed'));
      }
    },
    [userProfile, setUserProfile, setCurrentProvider, t],
  );

  const handleSelectProvider = useCallback(
    (value: string, type: 'webSearch' | 'urlParsing' | 'pdfParsing') => {
      const selectedProvider = providers.find((provider) => provider.providerId === value);
      if (selectedProvider) {
        updateUserProfile(type, selectedProvider);
      }
    },
    [providers, updateUserProfile],
  );

  const handleCreateProviderSuccess = useCallback(
    (provider: Provider) => {
      refetch();
      if (provider.enabled) {
        setCurrentProvider(currentType, provider);
        updateUserProfile(currentType, provider);
      }
    },
    [currentType, refetch, setCurrentProvider, updateUserProfile],
  );

  useEffect(() => {
    if (visible) {
      refetch();
    }
  }, [visible, refetch]);

  // Prepare provider options for each type
  const getProviderOptions = useMemo(() => {
    return {
      webSearch: [
        ...(webSearchProviders?.map((provider) => ({
          label: `${provider.name} (${provider.providerKey})`,
          value: provider.providerId,
        })) || []),
      ],
      urlParsing: [
        {
          label: t('settings.parserConfig.cheerio'),
          value: DEFAULT_PROVIDERS.urlParsing,
        },
        ...(urlParsingProviders?.map((provider) => ({
          label: `${provider.name} (${provider.providerKey})`,
          value: provider.providerId,
        })) || []),
      ],
      pdfParsing: [
        {
          label: t('settings.parserConfig.pdfjs'),
          value: DEFAULT_PROVIDERS.pdfParsing,
        },
        ...(pdfParsingProviders?.map((provider) => ({
          label: `${provider.name} (${provider.providerKey})`,
          value: provider.providerId,
        })) || []),
      ],
    };
  }, [t, webSearchProviders, urlParsingProviders, pdfParsingProviders]);

  // Render select dropdown
  const renderSelectDropdown = useCallback(
    (menu: React.ReactNode, type: ParserCategory) => {
      return (
        <>
          {isLoading ? (
            <Loading />
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto">{menu}</div>
              <div className="p-2 border-t border-gray-200">
                <Button
                  type="text"
                  icon={<IconPlus />}
                  onClick={() => openProviderModal(type)}
                  className="flex items-center w-full"
                >
                  {t('settings.parserConfig.createProvider')}
                </Button>
              </div>
            </>
          )}
        </>
      );
    },
    [isLoading, openProviderModal, t],
  );

  // Configuration data for each parser type
  const configData = useMemo(
    () => [
      {
        type: 'webSearch' as const,
        title: t('settings.parserConfig.webSearch'),
        value: webSearchValue,
        options: getProviderOptions.webSearch,
      },
      {
        type: 'urlParsing' as const,
        title: t('settings.parserConfig.urlParsing'),
        value: urlParsingValue,
        options: getProviderOptions.urlParsing,
      },
      {
        type: 'pdfParsing' as const,
        title: t('settings.parserConfig.pdfParsing'),
        value: pdfParsingValue,
        options: getProviderOptions.pdfParsing,
      },
    ],
    [t, webSearchValue, urlParsingValue, pdfParsingValue, getProviderOptions],
  );

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ContentHeader title={t('settings.tabs.parserConfig')} />

      <div className="px-5 py-6 w-full h-full box-border overflow-y-auto">
        <div className="flex flex-col gap-6">
          {configData.map((config) => (
            <ConfigCard
              key={config.type}
              title={config.title}
              value={config.value ?? ''}
              options={config.options}
              type={config.type}
              onSelect={handleSelectProvider}
              renderDropdown={renderSelectDropdown}
            />
          ))}

          {/* Provider Modal */}
          <ProviderModal
            isOpen={isProviderModalOpen}
            filterCategory={currentType}
            presetProviders={presetProviders}
            onClose={handleProviderModalClose}
            onSuccess={handleCreateProviderSuccess}
            disabledEnableControl={true}
          />
        </div>
      </div>
    </div>
  );
});

ConfigCard.displayName = 'ConfigCard';
