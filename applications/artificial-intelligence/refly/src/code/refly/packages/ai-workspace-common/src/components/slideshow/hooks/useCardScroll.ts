import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing card scroll behavior
 * - Controls whether a card's content can be scrolled
 * - Enables scrolling when card is clicked
 * - Disables scrolling when clicking outside
 */
export const useCardScroll = () => {
  // Track the currently active card that can be scrolled
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Handle card click to enable scrolling for that specific card
  const handleCardClick = useCallback((cardId: string) => {
    setActiveCardId(cardId);
  }, []);

  // Handle click outside to disable scrolling for all cards
  const handleClickOutside = useCallback(() => {
    setActiveCardId(null);
  }, []);

  // Add document-level click listener to detect clicks outside cards
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Check if click is outside of any card element
      const isOutsideCard =
        !e.target || !(e.target as HTMLElement).closest('[id^="content-block-"]');
      if (isOutsideCard) {
        handleClickOutside();
      }
    };

    // Add event listener to document
    document.addEventListener('click', handleDocumentClick);

    // Remove event listener on component unmount
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleClickOutside]);

  return {
    activeCardId,
    handleCardClick,
    handleClickOutside,
  };
};
