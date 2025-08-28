import { memo } from 'react';
import type { CanvasNode } from '@refly/canvas-common';

type VideoNodeMeta = {
  videoUrl?: string;
  showTitle?: boolean;
};

interface VideoNodePreviewProps {
  node: CanvasNode<VideoNodeMeta>;
}

const VideoNodePreviewComponent = ({ node }: VideoNodePreviewProps) => {
  const videoUrl = node?.data?.metadata?.videoUrl ?? '';
  const title = node?.data?.title ?? 'Video';

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-refly-text-2 text-sm">
        No video to preview
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        src={videoUrl}
        controls
        className="max-w-full max-h-full object-contain"
        preload="metadata"
        aria-label={title}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export const VideoNodePreview = memo(
  VideoNodePreviewComponent,
  (prevProps, nextProps) =>
    prevProps?.node?.data?.metadata?.videoUrl === nextProps?.node?.data?.metadata?.videoUrl &&
    prevProps?.node?.data?.title === nextProps?.node?.data?.title,
);

VideoNodePreview.displayName = 'VideoNodePreview';
