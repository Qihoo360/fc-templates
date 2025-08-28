import { SourceList } from '@refly-packages/ai-workspace-common/components/source-list';
import { Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';

interface SourceViewerProps {
  sources: Source[];
  query: string;
}

const SourceViewerComponent = (props: SourceViewerProps) => {
  const { sources, query } = props;
  const { t } = useTranslation();

  return (
    <div className="w-full my-2">
      {(sources || [])?.length > 0 ? (
        <div className="session-title-icon mb-[8px]">
          <p>{t('threadDetail.item.session.source')}</p>
        </div>
      ) : null}
      <SourceList sources={sources || []} query={query} />
    </div>
  );
};

export const SourceViewer = memo(SourceViewerComponent, (prevProps, nextProps) => {
  return prevProps.query === nextProps.query && prevProps.sources === nextProps.sources;
});
