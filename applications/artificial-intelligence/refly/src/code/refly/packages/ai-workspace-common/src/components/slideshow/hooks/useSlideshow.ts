import { useState, useCallback, useEffect, useRef } from 'react';
import { type NodeRelation } from '../components/ArtifactRenderer';

interface UseSlideshowOptions {
  nodes: NodeRelation[];
  isPreviewMode: boolean;
  handleUiInteraction: () => void;
}

/**
 * Slideshow preview mode Hook
 */
export const useSlideshow = ({
  nodes,
  isPreviewMode,
  handleUiInteraction,
}: UseSlideshowOptions) => {
  // Slideshow state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const previewContentRef = useRef<HTMLDivElement>(null);

  // Slideshow navigation methods
  const nextSlide = useCallback(() => {
    if (currentSlideIndex < nodes.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, nodes.length]);

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  // Handle slideshow selection
  const handlePreviewSlideSelect = useCallback((index: number) => {
    setCurrentSlideIndex(index);
  }, []);

  // Keyboard navigation control
  useEffect(() => {
    if (!isPreviewMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'Escape':
          // Don't set isPreviewMode directly, handle through external callback
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, nextSlide, prevSlide]);

  // Add touch gesture support
  useEffect(() => {
    if (!isPreviewMode || !previewContentRef.current) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      // Reset idle state on touch
      handleUiInteraction();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleTouchMove = () => {
      // Reset idle state on touch movement
      handleUiInteraction();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      if (touchEndX < touchStartX - swipeThreshold) {
        nextSlide();
      }
      if (touchEndX > touchStartX + swipeThreshold) {
        prevSlide();
      }
    };

    const element = previewContentRef.current;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPreviewMode, nextSlide, prevSlide, handleUiInteraction]);

  // Reset current slide index
  const resetSlideIndex = useCallback(() => {
    setCurrentSlideIndex(0);
  }, []);

  return {
    currentSlideIndex,
    setCurrentSlideIndex,
    nextSlide,
    prevSlide,
    handlePreviewSlideSelect,
    previewContentRef,
    resetSlideIndex,
  };
};
