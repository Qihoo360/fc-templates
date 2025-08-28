import { useTranslation } from 'react-i18next';

import { TemplatesGuide } from './templates-guide';
import { canvasTemplateEnabled } from '@refly/ui-kit';

export const EmptyGuide = ({ canvasId }: { canvasId: string }) => {
  const { t } = useTranslation();

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[80%]"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex flex-col items-center justify-center text-gray-500 text-center gap-4"
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-[20px]" style={{ pointerEvents: 'none' }}>
          {t('canvas.emptyText')}
        </div>
      </div>
      {canvasTemplateEnabled && <TemplatesGuide canvasId={canvasId} />}
    </div>
  );
};
