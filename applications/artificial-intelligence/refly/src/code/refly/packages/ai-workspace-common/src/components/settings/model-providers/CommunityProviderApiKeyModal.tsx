import React, { memo, useMemo } from 'react';
import { Modal, Form, Input, Button, Tooltip } from 'antd';
import { KeyOutlined } from '@ant-design/icons';

import { CommunityProviderConfig } from './provider-store-types';
import { useTranslation } from 'react-i18next';
import { CategoryTag } from './CommunityProviderCard';
import { Doc } from 'refly-icons';

interface ApiKeyConfiguration {
  apiKey: string;
  baseUrl?: string;
  [key: string]: any;
}

interface CommunityProviderApiKeyModalProps {
  visible: boolean;
  config: CommunityProviderConfig;
  onClose: () => void;
  onSuccess?: (userConfig: { apiKey: string; baseUrl?: string }) => void;
  loading?: boolean;
}

export const CommunityProviderApiKeyModal: React.FC<CommunityProviderApiKeyModalProps> = memo(
  ({ visible, config, onClose, onSuccess, loading: externalLoading }) => {
    const [form] = Form.useForm<ApiKeyConfiguration>();
    const { t } = useTranslation();

    // Get form values to check if API key is filled
    const formValues = Form.useWatch([], form);
    const apiKeyValue = formValues?.apiKey;
    const isApiKeyValid = useMemo(() => {
      return apiKeyValue && apiKeyValue.trim().length > 0;
    }, [apiKeyValue]);

    // Handle installation with API key
    const handleInstall = async (values: ApiKeyConfiguration) => {
      console.log('values', values);
      try {
        // Call the parent's onSuccess handler with the user configuration
        onSuccess?.({
          apiKey: values.apiKey,
          baseUrl: values.baseUrl || config.baseUrl,
        });
      } catch (error) {
        console.error('Install error:', error);
      }
    };

    // Handle modal close
    const handleClose = () => {
      form.resetFields();
      onClose();
    };

    // Get localized description
    const description =
      typeof config.description === 'object'
        ? config.description?.['zh-CN'] || config.description?.en || ''
        : config.description || '';

    const isLoading = externalLoading;

    return (
      <Modal
        centered
        open={visible}
        onCancel={handleClose}
        width={520}
        title={null}
        footer={null}
        destroyOnHidden
        maskClosable={!isLoading}
        closable={false}
      >
        <div className="text-refly-text-0 text-[16px] font-semibold leading-7">
          {t('settings.modelProviders.community.configureApiKey')}
        </div>

        {/* Provider information */}
        <div className="mt-5 border-solid border-[1px] border-refly-Card-Border rounded-lg p-3">
          <div className="mb-2 flex justify-between">
            <div>
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

            {config.documentation && (
              <Tooltip
                title={t('settings.modelProviders.community.viewDocumentation')}
                placement="top"
              >
                <div
                  onClick={() => {
                    window.open(config.documentation, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-8 h-8 cursor-pointer flex-shrink-0 rounded-md bg-refly-tertiary-default flex items-center justify-center hover:bg-refly-tertiary-hover"
                >
                  <Doc size={24} />
                </div>
              </Tooltip>
            )}
          </div>

          <div className="text-xs text-refly-text-2 line-clamp-3">{description}</div>
        </div>

        <div className="my-3 text-refly-func-warning-default">
          {t('settings.modelProviders.community.apiKeyRequiredDescription')}
        </div>

        {/* API key configuration form */}
        <Form form={form} layout="vertical" onFinish={handleInstall} disabled={isLoading}>
          <Form.Item
            name="apiKey"
            label={t('settings.modelProviders.community.apiKeyLabel')}
            rules={[
              {
                required: true,
                message: t('settings.modelProviders.community.apiKeyPlaceholder'),
              },
              {
                min: 1,
                message: t('settings.modelProviders.community.apiKeyPlaceholder'),
              },
            ]}
          >
            <Input.Password
              placeholder={t('settings.modelProviders.community.apiKeyPlaceholder')}
              prefix={<KeyOutlined />}
              size="middle"
            />
          </Form.Item>

          {/* Optional base URL field */}
          <Form.Item
            name="baseUrl"
            label={t('settings.modelProviders.community.baseUrlLabel')}
            extra={t('settings.modelProviders.community.baseUrlDescription')}
          >
            <Input
              placeholder={
                config.baseUrl || t('settings.modelProviders.community.baseUrlPlaceholder')
              }
              size="middle"
            />
          </Form.Item>

          {/* Footer buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={handleClose} disabled={isLoading} className="px-3 py-1.5">
              {t('settings.modelProviders.community.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              disabled={isLoading || !isApiKeyValid}
            >
              {isLoading
                ? t('settings.modelProviders.community.installing')
                : t('settings.modelProviders.community.install')}
            </Button>
          </div>
        </Form>
      </Modal>
    );
  },
);

CommunityProviderApiKeyModal.displayName = 'CommunityProviderApiKeyModal';
