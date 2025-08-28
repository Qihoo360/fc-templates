import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';

export const LoadLoading = () => {
  const { t } = useTranslation();

  return (
    <div className="popup-page loading-page h-full flex justify-center items-center">
      <div className="loading-content">
        <Spin size="large" />
        <p>{t('extension.popup.loading')}</p>
      </div>
    </div>
  );
};
