import { memo, useCallback } from 'react';
import { Modal, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { LuDatabase } from 'react-icons/lu';
import { useSubscriptionStoreShallow } from '@refly/stores';
import { logEvent } from '@refly/telemetry-web';

export const StorageExceededModal = memo(() => {
  const { t } = useTranslation();

  const { storageExceededModalVisible, setStorageExceededModalVisible, setSubscribeModalVisible } =
    useSubscriptionStoreShallow((state) => ({
      storageExceededModalVisible: state.storageExceededModalVisible,
      setStorageExceededModalVisible: state.setStorageExceededModalVisible,
      setSubscribeModalVisible: state.setSubscribeModalVisible,
    }));

  const handleUpgrade = useCallback(() => {
    logEvent('subscription::upgrade_click', 'storage_exceeded_modal');
    setStorageExceededModalVisible(false);
    setSubscribeModalVisible(true);
  }, [setStorageExceededModalVisible, setSubscribeModalVisible]);

  return (
    <Modal
      open={storageExceededModalVisible}
      centered
      footer={null}
      width={410}
      onCancel={() => setStorageExceededModalVisible(false)}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="flex flex-row items-center">
          <span className="flex items-center justify-center text-3xl text-red-500">
            <LuDatabase />
          </span>
        </div>

        <div className="text-xl font-bold text-center">
          {t('subscription.storageExceeded.title', 'Storage Quota Exceeded')}
        </div>

        <div className="text-sm text-gray-500 text-center mt-2">
          {t(
            'subscription.storageExceeded.description',
            'You have reached your storage limit. Upgrade your plan to continue using our services with expanded storage capacity.',
          )}
        </div>

        <div className="flex flex-col w-full gap-2 mt-4">
          <Button type="primary" className="w-full" onClick={handleUpgrade}>
            {t('subscription.storageExceeded.upgrade', 'Upgrade Now')}
          </Button>

          <Button className="w-full" onClick={() => setStorageExceededModalVisible(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});
