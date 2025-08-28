import React, { memo, useState, useCallback } from 'react';
import { Button, Typography, message, Tooltip } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { Doc } from 'refly-icons';
import { useTranslation } from 'react-i18next';

import { CommunityProviderConfig } from './provider-store-types';
import { convertCommunityConfigToProviderRequest, requiresApiKey } from './provider-store-utils';
import { CommunityProviderApiKeyModal } from './CommunityProviderApiKeyModal';
import { useCreateProvider } from '@refly-packages/ai-workspace-common/queries';

const { Paragraph } = Typography;

export const CategoryTag = ({ category }: { category: string }) => {
  return (
    <span className="px-2 h-[18px] flex items-center justify-center rounded-[4px] bg-refly-bg-control-z0 text-[10px] leading-[14px] text-refly-text-1 border-solid border-[1px] border-refly-Card-Border whitespace-nowrap font-semibold">
      {category}
    </span>
  );
};

interface CommunityProviderCardProps {
  config: CommunityProviderConfig;
  isInstalled?: boolean;
  onInstallSuccess?: (config: CommunityProviderConfig) => void;
}

export const CommunityProviderCard: React.FC<CommunityProviderCardProps> = memo(
  ({ config, isInstalled = false, onInstallSuccess }) => {
    const [isCurrentlyInstalling, setIsCurrentlyInstalling] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const { t, i18n } = useTranslation();
    const language = i18n.language;

    // Initialize the create MCP server mutation
    const createProvider = useCreateProvider([], {
      onSuccess: (response) => {
        if (!response?.data?.success) {
          throw response?.data?.errMsg;
        }
        setIsCurrentlyInstalling(false);
      },
      onError: (error) => {
        console.error('Installation error:', error);
        message.error(t('settings.mcpServer.community.installError', { name: config.name }));
        setIsCurrentlyInstalling(false);
      },
    });

    // Handle installation with user configuration (API key, etc.)
    const handleInstallWithConfig = useCallback(
      async (userConfig?: { apiKey: string; baseUrl?: string }) => {
        try {
          setIsCurrentlyInstalling(true);

          const request = convertCommunityConfigToProviderRequest(config, userConfig);
          await createProvider.mutateAsync({
            body: request,
          });

          setShowApiKeyModal(false);
          onInstallSuccess?.(config);
        } catch (error) {
          console.error('Installation error:', error);
          message.error(t('settings.modelProviders.community.installError', { name: config.name }));
        } finally {
          setIsCurrentlyInstalling(false);
        }
      },
      [config, createProvider, onInstallSuccess, t],
    );

    // Handle install button click
    const handleInstall = useCallback(() => {
      if (requiresApiKey(config)) {
        setShowApiKeyModal(true);
      } else {
        handleInstallWithConfig();
      }
    }, [config, handleInstallWithConfig]);

    // Handle documentation link click
    const handleDocumentationClick = useCallback(() => {
      if (config.documentation) {
        window.open(config.documentation, '_blank', 'noopener,noreferrer');
      }
    }, [config.documentation]);

    // Get localized description
    const description =
      typeof config.description === 'object'
        ? config.description?.[language as keyof typeof config.description] ||
          config.description?.en ||
          ''
        : config.description || '';

    // Get button properties based on state
    const getButtonProps = () => {
      if (isInstalled) {
        return {
          icon: <CheckOutlined />,
          children: t('settings.modelProviders.community.installed'),
          disabled: true,
          style: {
            color: '#52c41a',
            borderColor: '#52c41a',
            backgroundColor: '#f6ffed',
          },
        };
      }

      if (isCurrentlyInstalling) {
        return {
          loading: true,
          children: t('settings.modelProviders.community.installing'),
          disabled: true,
        };
      }

      return {
        children: t('settings.modelProviders.community.install'),
        onClick: handleInstall,
      };
    };

    const buttonProps = getButtonProps();

    return (
      <>
        <div className="p-4 bg-refly-bg-content-z2 border-solid border-[1px] border-refly-Card-Border rounded-lg hover:shadow-refly-m transition-all duration-200">
          <div className="mb-2">
            <div className="flex items-center mb-0.5 text-refly-text-0 text-base leading-[26px] line-clamp-1 font-semibold">
              {config.name}
            </div>

            <div className="flex items-center flex-wrap gap-1 h-5">
              {config.categories?.length > 0
                ? config.categories.map((category, index) => (
                    <CategoryTag key={`${category}-${index}`} category={category} />
                  ))
                : config.category && <CategoryTag category={config.category} />}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-refly-text-1 text-sm leading-relaxed min-h-[4.5rem] flex items-start">
              <Paragraph
                className="text-refly-text-1 text-sm !mb-0"
                ellipsis={{ rows: 3, tooltip: true }}
              >
                {description || t('settings.modelProviders.community.noDescription')}
              </Paragraph>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              {...buttonProps}
              size="middle"
              type="text"
              variant="filled"
              className={`h-8 flex-1 cursor-pointer font-semibold border-solid border-[1px] border-refly-Card-Border rounded-lg bg-refly-tertiary-default ${
                buttonProps.disabled ? '' : 'hover:!bg-refly-tertiary-hover'
              }`}
            />

            {config.documentation && (
              <Tooltip
                title={t('settings.modelProviders.community.viewDocumentation')}
                placement="bottom"
              >
                <div
                  onClick={handleDocumentationClick}
                  className="w-8 h-8 cursor-pointer flex-shrink-0 rounded-md bg-refly-tertiary-default flex items-center justify-center hover:bg-refly-tertiary-hover"
                >
                  <Doc size={24} />
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* API Key Configuration Modal */}
        <CommunityProviderApiKeyModal
          visible={showApiKeyModal}
          config={config}
          onClose={() => setShowApiKeyModal(false)}
          onSuccess={handleInstallWithConfig}
          loading={isCurrentlyInstalling}
        />
      </>
    );
  },
);

CommunityProviderCard.displayName = 'CommunityProviderCard';
