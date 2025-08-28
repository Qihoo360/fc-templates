import { memo, useMemo } from 'react';
import { Source } from '@refly/openapi-schema';
import { Spin } from 'antd';
import { parseMarkdownCitationsAndCanvasTags } from '@refly/utils';

interface MultimodalContentPreviewProps {
  content: string;
  sources?: Source[];
  className?: string;
  resultId?: string;
  metadata?: {
    contentType?: string;
    generationConfig?: any;
  };
}

// Preview components for different content types
const ImagePreview = memo(({ config }: { config?: any }) => (
  <div className="text-gray-600 text-sm">
    <div className="flex items-center gap-2 mb-2">
      <Spin className="w-4 h-4" />
      <span>Generating image...</span>
    </div>
    {config && (
      <div className="text-xs text-gray-500">
        Style: {config.style || 'realistic'} | Ratio: {config.aspectRatio || '1:1'}
      </div>
    )}
  </div>
));

const VideoPreview = memo(({ config }: { config?: any }) => (
  <div className="text-gray-600 text-sm">
    <div className="flex items-center gap-2 mb-2">
      <Spin className="w-4 h-4" />
      <span>Generating video...</span>
    </div>
    {config && (
      <div className="text-xs text-gray-500">
        Duration: {config.duration || 30}s | Ratio: {config.aspectRatio || '16:9'} | Style:{' '}
        {config.style || 'realistic'}
      </div>
    )}
  </div>
));

const AudioPreview = memo(({ config }: { config?: any }) => (
  <div className="text-gray-600 text-sm">
    <div className="flex items-center gap-2 mb-2">
      <Spin className="w-4 h-4" />
      <span>Generating audio...</span>
    </div>
    {config && (
      <div className="text-xs text-gray-500">
        Type: {config.audioType || 'music'} | Duration: {config.duration || 60}s | Mood:{' '}
        {config.mood || 'neutral'}
      </div>
    )}
  </div>
));

const TextContent = memo(
  ({
    content,
    sources,
    className,
  }: {
    content: string;
    sources?: Source[];
    className?: string;
    resultId?: string;
  }) => {
    const plainText = useMemo(() => {
      // Use parseMarkdownCitationsAndCanvasTags to clean content
      const cleanedContent = parseMarkdownCitationsAndCanvasTags(content, sources || []);

      // Remove remaining markdown syntax and convert to plain text
      return cleanedContent
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .trim();
    }, [content, sources]);

    const textClassName = useMemo(
      () => `text-xs leading-relaxed overflow-hidden ${className}`,
      [className],
    );

    return (
      <div
        className={textClassName}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {plainText}
      </div>
    );
  },
);

export const MultimodalContentPreview = memo(
  ({ content, sources, className = '', resultId, metadata }: MultimodalContentPreviewProps) => {
    const contentType = metadata?.contentType || 'text';
    const generationConfig = metadata?.generationConfig;

    // Suppress unused variable warnings for resultId when content type is not text
    void resultId;

    const renderContent = () => {
      switch (contentType) {
        case 'image':
          return <ImagePreview config={generationConfig} />;
        case 'video':
          return <VideoPreview config={generationConfig} />;
        case 'audio':
          return <AudioPreview config={generationConfig} />;
        default:
          return <TextContent content={content} sources={sources} className={className} />;
      }
    };

    return <div className="multimodal-content-preview">{renderContent()}</div>;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.className === nextProps.className &&
      JSON.stringify(prevProps.sources) === JSON.stringify(nextProps.sources) &&
      JSON.stringify(prevProps.metadata) === JSON.stringify(nextProps.metadata)
    );
  },
);
