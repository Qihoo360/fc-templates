import { useState, useCallback, useRef, useEffect } from 'react';

interface UIState {
  isIdle: boolean;
  showNav: boolean;
}

interface Timers {
  idle: NodeJS.Timeout | null;
  nav: NodeJS.Timeout | null;
  minimap: NodeJS.Timeout | null;
}

interface UsePreviewUIOptions {
  isPreviewMode: boolean;
}

/**
 * Preview mode UI state management Hook
 */
export const usePreviewUI = ({ isPreviewMode }: UsePreviewUIOptions) => {
  // UI state
  const [uiState, setUiState] = useState<UIState>({
    isIdle: false,
    showNav: false,
  });

  // Preview mode minimap state
  const [showPreviewMinimap, setShowPreviewMinimap] = useState(false);

  // Timer references
  const timersRef = useRef<Timers>({
    idle: null,
    nav: null,
    minimap: null,
  });

  // Unified UI state update function
  const updateUiState = useCallback((updates: Partial<UIState>) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset timer
  const resetTimer = useCallback((timerKey: keyof Timers, callback: () => void, delay: number) => {
    if (timersRef.current[timerKey]) {
      clearTimeout(timersRef.current[timerKey]!);
    }
    timersRef.current[timerKey] = setTimeout(callback, delay);
  }, []);

  // Reset idle state
  const resetIdleState = useCallback(() => {
    updateUiState({ isIdle: false });

    if (isPreviewMode) {
      resetTimer(
        'idle',
        () => {
          updateUiState({ isIdle: true, showNav: false });
        },
        2000,
      ); // Hide navigation bar after 2 seconds of inactivity
    }
  }, [isPreviewMode, updateUiState, resetTimer]);

  // Unified UI interaction handler
  const handleUiInteraction = useCallback(() => {
    resetIdleState();
    updateUiState({ showNav: true });

    resetTimer(
      'nav',
      () => {
        if (uiState.isIdle) {
          updateUiState({ showNav: false });
        }
      },
      3000,
    ); // Hide after 3 seconds if in idle state
  }, [resetIdleState, updateUiState, resetTimer, uiState.isIdle]);

  // Preview mode mouse movement handler
  const handlePreviewMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPreviewMode) return;

      handleUiInteraction();

      // Show minimap when mouse moves to the left edge of the screen
      if (e.clientX < 20) {
        setShowPreviewMinimap(true);
        resetTimer('minimap', () => {}, 0);
      }
    },
    [isPreviewMode, handleUiInteraction, resetTimer],
  );

  // Minimap interaction handlers
  const handleMinimapMouseEnter = useCallback(() => {
    if (timersRef.current.minimap) {
      clearTimeout(timersRef.current.minimap);
      timersRef.current.minimap = null;
    }
  }, []);

  const handleMinimapMouseLeave = useCallback(() => {
    setShowPreviewMinimap(false);
  }, []);

  const handleSideHintClick = useCallback(() => {
    setShowPreviewMinimap(true);
  }, []);

  // Handle preview mode state changes
  useEffect(() => {
    if (isPreviewMode) {
      resetIdleState();
      updateUiState({ showNav: true });
    } else {
      updateUiState({ isIdle: false, showNav: false });
      for (const key of Object.keys(timersRef.current)) {
        const timerKey = key as keyof Timers;
        if (timersRef.current[timerKey]) {
          clearTimeout(timersRef.current[timerKey]!);
          timersRef.current[timerKey] = null;
        }
      }
    }
  }, [isPreviewMode, resetIdleState, updateUiState]);

  // Clean up all timers
  useEffect(() => {
    return () => {
      for (const timer of Object.values(timersRef.current)) {
        if (timer) clearTimeout(timer);
      }
    };
  }, []);

  return {
    uiState,
    showPreviewMinimap,
    setShowPreviewMinimap,
    handleUiInteraction,
    handlePreviewMouseMove,
    handleMinimapMouseEnter,
    handleMinimapMouseLeave,
    handleSideHintClick,
    resetIdleState,
  };
};
