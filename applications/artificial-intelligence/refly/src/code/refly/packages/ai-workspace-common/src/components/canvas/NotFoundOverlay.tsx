import React from 'react';
import { Button } from 'antd';
import { RiErrorWarningLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';

/**
 * Displays an overlay when a shared canvas is not found (404 error)
 */
const NotFoundOverlay = React.memo(() => {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div className="bg-white rounded-lg p-8 max-w-md shadow-lg border border-gray-200 text-center">
        <RiErrorWarningLine className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('canvas.shareNotFound')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('canvas.shareNotFoundHint')}</p>
        <Button type="primary" onClick={() => window.history.back()}>
          {t('common.goBack')}
        </Button>
      </div>
    </div>
  );
});

NotFoundOverlay.displayName = 'NotFoundOverlay';

export default NotFoundOverlay;
