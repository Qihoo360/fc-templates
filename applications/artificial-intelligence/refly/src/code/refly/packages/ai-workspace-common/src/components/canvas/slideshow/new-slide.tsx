import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty } from 'antd';
import { CreatePageFromCanvas } from './create-from-canvas';

const NewSlide = memo(
  ({
    canvasId,
    afterCreate,
  }: {
    canvasId: string;
    afterCreate: (pageId: string) => void;
  }) => {
    const { t } = useTranslation();

    return (
      <div className="w-full h-full px-6 flex flex-col items-center justify-center overflow-hidden">
        <Empty description={t('pages.slideshow.newSlideDescription')} />

        <CreatePageFromCanvas canvasId={canvasId} afterCreate={afterCreate} />
      </div>
    );
  },
);

NewSlide.displayName = 'NewSlide';

export default NewSlide;
