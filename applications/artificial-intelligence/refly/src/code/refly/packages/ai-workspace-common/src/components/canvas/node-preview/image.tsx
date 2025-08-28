import { memo } from 'react';
import type { CanvasNode, ImageNodeMeta } from '@refly/canvas-common';

interface ImageNodePreviewProps {
  node: CanvasNode<ImageNodeMeta>;
}

const ImageNodePreviewComponent = ({ node }: ImageNodePreviewProps) => {
  const imageUrl = node?.data?.metadata?.imageUrl ?? '';
  const title = node?.data?.title ?? 'Image';

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        No image to preview
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <img
        src={imageUrl}
        alt={title}
        className="max-w-full max-h-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const ImageNodePreview = memo(
  ImageNodePreviewComponent,
  (prevProps, nextProps) =>
    prevProps?.node?.data?.metadata?.imageUrl === nextProps?.node?.data?.metadata?.imageUrl &&
    prevProps?.node?.data?.title === nextProps?.node?.data?.title,
);

ImageNodePreview.displayName = 'ImageNodePreview';
