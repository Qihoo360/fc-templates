import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useListProviderItems } from '@refly-packages/ai-workspace-common/queries/queries';
import { useUserStoreShallow } from '@refly/stores';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import {
  ProviderItem,
  MediaGenerationModelConfig,
} from '@refly-packages/ai-workspace-common/requests/types.gen';
import { Select, message, Skeleton } from 'antd';

type ModelSelectProps = {
  value?: ProviderItem;
  onChange: (model: ProviderItem) => void;
  options: ProviderItem[];
  placeholder: string;
  description: string;
  title: string;
  isUpdating?: boolean;
};

const ModelSelect = React.memo(
  ({ value, onChange, options, placeholder, description, title, isUpdating }: ModelSelectProps) => {
    const { t } = useTranslation();
    const handleModelChange = useCallback(
      (itemId: string) => {
        const selectedModel = options?.find((model) => model?.itemId === itemId);
        if (selectedModel) {
          onChange(selectedModel);
        }
      },
      [onChange, options],
    );

    let finalOptions = options;
    if (value?.itemId && !options?.find((option) => option?.itemId === value?.itemId)) {
      finalOptions = [value, ...options];
    }

    return (
      <div className="mb-6 flex flex-col gap-2">
        <div className="text-sm font-semibold text-refly-text-0 leading-5">{title}</div>
        <Select
          className="w-full"
          placeholder={placeholder}
          value={value?.itemId}
          loading={isUpdating}
          onChange={handleModelChange}
          options={finalOptions?.map((model) => ({
            label: `${model?.name ?? ''} (${model?.provider?.name ?? t('common.unknown')})`,
            value: model?.itemId ?? '',
          }))}
        />
        <div className="text-xs text-refly-text-2 leading-4">{description}</div>
      </div>
    );
  },
);

ModelSelect.displayName = 'ModelSelect';

export const DefaultModel = React.memo(({ visible }: { visible: boolean }) => {
  const { t } = useTranslation();
  const { userProfile, setUserProfile } = useUserStoreShallow((state) => ({
    userProfile: state?.userProfile,
    setUserProfile: state?.setUserProfile,
  }));

  const { data, isLoading, refetch } = useListProviderItems({
    query: {
      enabled: true,
      category: 'llm',
      isGlobal: userProfile?.preferences?.providerMode === 'global',
    },
  });

  const {
    data: mediaData,
    isLoading: isMediaLoading,
    refetch: refetchMedia,
  } = useListProviderItems({
    query: {
      enabled: true,
      category: 'mediaGeneration',
      isGlobal: userProfile?.preferences?.providerMode === 'global',
    },
  });

  const llmProviders = useMemo(() => data?.data ?? [], [data?.data]);
  const allMediaProviders = useMemo(() => mediaData?.data ?? [], [mediaData?.data]);

  // Filter media providers by capabilities
  const imageProviders = useMemo(() => {
    return allMediaProviders.filter((provider) => {
      try {
        const configStr =
          typeof provider.config === 'string' ? provider.config : JSON.stringify(provider.config);
        const config = JSON.parse(configStr) as MediaGenerationModelConfig;
        return config.capabilities?.image === true;
      } catch {
        return false;
      }
    });
  }, [allMediaProviders]);

  const videoProviders = useMemo(() => {
    return allMediaProviders.filter((provider) => {
      try {
        const configStr =
          typeof provider.config === 'string' ? provider.config : JSON.stringify(provider.config);
        const config = JSON.parse(configStr) as MediaGenerationModelConfig;
        return config.capabilities?.video === true;
      } catch {
        return false;
      }
    });
  }, [allMediaProviders]);

  const audioProviders = useMemo(() => {
    return allMediaProviders.filter((provider) => {
      try {
        const configStr =
          typeof provider.config === 'string' ? provider.config : JSON.stringify(provider.config);
        const config = JSON.parse(configStr) as MediaGenerationModelConfig;
        return config.capabilities?.audio === true;
      } catch {
        return false;
      }
    });
  }, [allMediaProviders]);

  const defaultPreferences = useMemo(
    () => userProfile?.preferences ?? {},
    [userProfile?.preferences],
  );
  const defaultModel = useMemo(() => defaultPreferences?.defaultModel ?? {}, [defaultPreferences]);

  const [chatModel, setChatModel] = useState<ProviderItem | undefined>(defaultModel?.chat);
  const [agentModel, setAgentModel] = useState<ProviderItem | undefined>(defaultModel?.agent);
  const [queryAnalysisModel, setQueryAnalysisModel] = useState<ProviderItem | undefined>(
    defaultModel?.queryAnalysis,
  );
  const [titleGenerationModel, setTitleGenerationModel] = useState<ProviderItem | undefined>(
    defaultModel?.titleGeneration,
  );
  const [imageModel, setImageModel] = useState<ProviderItem | undefined>(defaultModel?.image);
  const [videoModel, setVideoModel] = useState<ProviderItem | undefined>(defaultModel?.video);
  const [audioModel, setAudioModel] = useState<ProviderItem | undefined>(defaultModel?.audio);

  const [updateLoading, setUpdateLoading] = useState<Record<string, boolean>>({});

  const updateSettings = useCallback(
    async (
      type: 'chat' | 'agent' | 'queryAnalysis' | 'titleGeneration' | 'image' | 'video' | 'audio',
      model?: ProviderItem,
    ) => {
      const updatedDefaultModel = {
        ...defaultModel,
        [type]: model,
      };

      const updatedPreferences = {
        ...defaultPreferences,
        defaultModel: updatedDefaultModel,
      };

      setUpdateLoading((prev) => ({ ...prev, [type]: true }));

      try {
        const res = await getClient().updateSettings({
          body: {
            preferences: updatedPreferences,
          },
        });

        if (res?.data?.success) {
          setUserProfile({
            ...userProfile!,
            preferences: updatedPreferences,
          });
          message.success(t('settings.defaultModel.updateSuccessfully'));
        }
      } catch (error) {
        console.error('Failed to update settings:', error);
        message.error(t('settings.defaultModel.updateFailed'));
      } finally {
        setUpdateLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [defaultModel, defaultPreferences, setUserProfile, userProfile, t],
  );

  const handleChatModelChange = useCallback(
    (model: ProviderItem) => {
      setChatModel(model);
      updateSettings('chat', model);
    },
    [updateSettings],
  );

  const handleQueryAnalysisModelChange = useCallback(
    (model: ProviderItem) => {
      setQueryAnalysisModel(model);
      updateSettings('queryAnalysis', model);
    },
    [updateSettings],
  );

  const handleTitleGenerationModelChange = useCallback(
    (model: ProviderItem) => {
      setTitleGenerationModel(model);
      updateSettings('titleGeneration', model);
    },
    [updateSettings],
  );

  const handleAgentModelChange = useCallback(
    (model: ProviderItem) => {
      setAgentModel(model);
      updateSettings('agent', model);
    },
    [updateSettings],
  );

  const handleImageModelChange = useCallback(
    (model: ProviderItem) => {
      setImageModel(model);
      updateSettings('image', model);
    },
    [updateSettings],
  );

  const handleVideoModelChange = useCallback(
    (model: ProviderItem) => {
      setVideoModel(model);
      updateSettings('video', model);
    },
    [updateSettings],
  );

  const handleAudioModelChange = useCallback(
    (model: ProviderItem) => {
      setAudioModel(model);
      updateSettings('audio', model);
    },
    [updateSettings],
  );

  useEffect(() => {
    if (visible) {
      refetch();
      refetchMedia();
    }
  }, [visible, refetch, refetchMedia]);

  useEffect(() => {
    if (visible) {
      setChatModel(defaultModel?.chat);
      setAgentModel(defaultModel?.agent);
      setQueryAnalysisModel(defaultModel?.queryAnalysis);
      setTitleGenerationModel(defaultModel?.titleGeneration);
      setImageModel(defaultModel?.image);
      setVideoModel(defaultModel?.video);
      setAudioModel(defaultModel?.audio);
    }
  }, [visible, defaultModel]);

  if (isLoading || isMediaLoading) {
    return (
      <div className="w-full h-full p-4">
        <Skeleton active paragraph={{ rows: 9 }} />
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full mb-200px">
      <ModelSelect
        value={chatModel}
        onChange={handleChatModelChange}
        options={llmProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.chat')}
        title={t('settings.defaultModel.chat')}
        isUpdating={updateLoading.chat}
      />

      <ModelSelect
        value={agentModel}
        onChange={handleAgentModelChange}
        options={llmProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.agent')}
        title={t('settings.defaultModel.agent')}
        isUpdating={updateLoading.agent}
      />

      <ModelSelect
        value={queryAnalysisModel}
        onChange={handleQueryAnalysisModelChange}
        options={llmProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.queryAnalysis')}
        title={t('settings.defaultModel.queryAnalysis')}
        isUpdating={updateLoading.queryAnalysis}
      />

      <ModelSelect
        value={titleGenerationModel}
        onChange={handleTitleGenerationModelChange}
        options={llmProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.titleGeneration')}
        title={t('settings.defaultModel.titleGeneration')}
        isUpdating={updateLoading.titleGeneration}
      />

      <ModelSelect
        value={imageModel}
        onChange={handleImageModelChange}
        options={imageProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.image')}
        title={t('settings.defaultModel.image')}
        isUpdating={updateLoading.image}
      />

      <ModelSelect
        value={videoModel}
        onChange={handleVideoModelChange}
        options={videoProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.video')}
        title={t('settings.defaultModel.video')}
        isUpdating={updateLoading.video}
      />

      <ModelSelect
        value={audioModel}
        onChange={handleAudioModelChange}
        options={audioProviders}
        placeholder={t('settings.defaultModel.noModel')}
        description={t('settings.defaultModel.description.audio')}
        title={t('settings.defaultModel.audio')}
        isUpdating={updateLoading.audio}
      />
    </div>
  );
});

DefaultModel.displayName = 'DefaultModel';
