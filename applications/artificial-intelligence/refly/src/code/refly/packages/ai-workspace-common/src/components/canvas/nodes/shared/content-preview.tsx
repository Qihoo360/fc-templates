import { memo, useMemo } from 'react';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { Source } from '@refly/openapi-schema';

interface ContentPreviewProps {
  content: string;
  sources?: Source[];
  className?: string;
  resultId?: string;
}

export const ContentPreview = memo(
  ({ content, sources, className = '', resultId }: ContentPreviewProps) => {
    const previewContent = content ?? '';

    const markdownClassName = useMemo(
      () => `text-xs overflow-hidden max-h-[120px] ${className}`,
      [className],
    );

    return (
      <Markdown
        className={markdownClassName}
        content={previewContent}
        sources={sources ?? []}
        resultId={resultId}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.className === nextProps.className &&
      JSON.stringify(prevProps.sources) === JSON.stringify(nextProps.sources)
    );
  },
);
