import { useRef, useEffect, useCallback } from 'react';

interface UseVideoProps {
  initialVolume?: number;
}

export const useVideo = ({ initialVolume = 0.5 }: UseVideoProps = {}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.volume = initialVolume;
    }
  }, [initialVolume]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', handlePlay);
      video.volume = initialVolume;
    }

    return () => {
      if (video) {
        video.removeEventListener('play', handlePlay);
      }
    };
  }, [handlePlay, initialVolume]);

  return {
    videoRef,
    handlePlay,
  };
};
