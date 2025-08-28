import { memo, useCallback, useEffect, useState } from 'react';
import type { CanvasNode } from '@refly/canvas-common';

type AudioNodeMeta = {
  audioUrl?: string;
  showTitle?: boolean;
};

interface AudioNodePreviewProps {
  node: CanvasNode<AudioNodeMeta>;
}

const FALLBACK_AUDIO_URLS = [
  'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
];

const AudioNodePreviewComponent = ({ node }: AudioNodePreviewProps) => {
  const originalUrl = node?.data?.metadata?.audioUrl ?? '';
  const title = node?.data?.title ?? 'Audio';
  const [currentUrl, setCurrentUrl] = useState(originalUrl);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentUrl(originalUrl);
    setFallbackIndex(0);
    setHasError(false);
  }, [originalUrl]);

  const handleError = useCallback(() => {
    if (fallbackIndex < FALLBACK_AUDIO_URLS.length) {
      setCurrentUrl(FALLBACK_AUDIO_URLS[fallbackIndex] ?? '');
      setFallbackIndex((idx) => idx + 1);
      setHasError(false);
    } else {
      setHasError(true);
    }
  }, [fallbackIndex]);

  if (!originalUrl && FALLBACK_AUDIO_URLS.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        No audio to preview
      </div>
    );
  }

  return (
    <div className="w-full h-full flex py-5 px-4 items-center justify-center">
      {hasError ? (
        <div className="text-center text-refly-text-2 text-sm">Failed to load audio</div>
      ) : (
        <audio
          src={currentUrl}
          controls
          className="w-full"
          preload="metadata"
          aria-label={title}
          onError={handleError}
          onLoadStart={() => setHasError(false)}
        >
          <track kind="captions" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export const AudioNodePreview = memo(
  AudioNodePreviewComponent,
  (prevProps, nextProps) =>
    prevProps?.node?.data?.metadata?.audioUrl === nextProps?.node?.data?.metadata?.audioUrl &&
    prevProps?.node?.data?.title === nextProps?.node?.data?.title,
);

AudioNodePreview.displayName = 'AudioNodePreview';
