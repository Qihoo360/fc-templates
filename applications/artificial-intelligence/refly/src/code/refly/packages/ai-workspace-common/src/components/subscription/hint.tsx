import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStoreShallow } from '@refly/stores';
import { useSubscriptionUsage } from '@refly-packages/ai-workspace-common/hooks/use-subscription-usage';
import { UsageProgress } from './usage-progress';
import { Button } from 'antd';
import { logEvent } from '@refly/telemetry-web';
import { IconSubscription } from '@refly-packages/ai-workspace-common/components/common/icon';

export const SubscriptionHint = memo(() => {
  const { t } = useTranslation();
  const { setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));

  const { tokenUsage, storageUsage } = useSubscriptionUsage();

  const handleUpgrade = useCallback(() => {
    logEvent('subscription::upgrade_click', 'sider');
    setSubscribeModalVisible(true);
  }, [setSubscribeModalVisible]);

  return (
    <div className="w-full rounded-md p-2 border-[1px] border-solid border-refly-Card-Border bg-refly-bg-control-z1">
      <div className="mb-1 text-sm font-medium text-refly-text-0">
        {t('settings.subscription.currentPlan')}:{' '}
        {t('settings.subscription.subscriptionStatus.free')}
      </div>

      <UsageProgress
        label={t('settings.subscription.t1Requests')}
        tooltip={`${t('settings.subscription.t1RequestsDescription')} ${t('settings.subscription.requestsRefresh')}`}
        used={tokenUsage?.t1CountUsed ?? 0}
        quota={tokenUsage?.t1CountQuota ?? 0}
      />

      <UsageProgress
        label={t('settings.subscription.t2Requests')}
        tooltip={`${t('settings.subscription.t2RequestsDescription')} ${t('settings.subscription.requestsRefresh')}`}
        used={tokenUsage?.t2CountUsed ?? 0}
        quota={tokenUsage?.t2CountQuota ?? 0}
      />

      <UsageProgress
        label={t('settings.subscription.libraryStorage')}
        tooltip={t('settings.subscription.libraryStorageDescription')}
        used={storageUsage?.fileCountUsed ?? 0}
        quota={storageUsage?.fileCountQuota ?? 0}
      />

      <div className="mt-2 flex justify-center">
        <Button
          className="w-full"
          type="primary"
          size="middle"
          icon={<IconSubscription className="flex items-center justify-center text-base" />}
          onClick={handleUpgrade}
        >
          <span className="text-sm">{t('settings.subscription.subscribeNow')}</span>
        </Button>
      </div>
    </div>
  );
});

SubscriptionHint.displayName = 'SubscriptionHint';
