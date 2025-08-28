import { useCallback, useEffect, useRef, useState } from 'react';
import type { Instance, Props } from 'tippy.js';

interface UseSelectionBubbleProps {
  containerClass?: string;
  containerRef?: React.RefObject<HTMLElement>;
  onSelect?: (selectedText: string) => void;
  enabled?: boolean;
}

export const useSelectionBubble = ({
  containerClass,
  containerRef,
  onSelect,
  enabled = true,
}: UseSelectionBubbleProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const bubbleRef = useRef<Instance<Props> | null>(null);

  const handleSelection = useCallback(() => {
    if ((event?.target as Element)?.closest('.refly-selector-hover-menu')) {
      return;
    }

    if (!enabled) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      setIsVisible(false);
      setSelectedText('');
      return;
    }

    const text = selection.toString().trim();

    // 如果没有选中文本，隐藏气泡
    if (!text || selection.isCollapsed) {
      setIsVisible(false);
      setSelectedText('');
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const selectionContainer = range.commonAncestorContainer;

      // 优先使用 ref，如果没有则使用 class 选择器
      const targetContainer =
        containerRef?.current ||
        (containerClass ? document.querySelector(`.${containerClass}`) : document.body);

      if (!targetContainer) return;

      // 检查选择是否在目标容器内
      const isWithinContainer = targetContainer.contains(selectionContainer);

      if (!isWithinContainer) {
        setIsVisible(false);
        setSelectedText('');
        return;
      }

      setSelectedText(text);
      setIsVisible(true);
      onSelect?.(text);
    } catch (error) {
      console.error('Selection error:', error);
      setIsVisible(false);
      setSelectedText('');
    }
  }, [containerClass, containerRef, enabled, onSelect]);

  // 处理点击外部
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if ((event.target as Element)?.closest('.refly-selector-hover-menu')) {
      return;
    }

    if (!containerRef?.current?.contains(event.target as Node)) {
      setIsVisible(false);
      setSelectedText('');
    }
  }, []);

  // 处理滚动
  const handleScroll = useCallback(() => {
    if (isVisible) {
      setIsVisible(false);
      setSelectedText('');
    }
  }, [isVisible]);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      setSelectedText('');
      return;
    }

    // 使用 mouseup 而不是 selectionchange
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [enabled, handleSelection, handleClickOutside, handleScroll]);

  const closeBubble = useCallback(() => {
    setIsVisible(false);
    setSelectedText('');
    // 清理选区
    window.getSelection()?.removeAllRanges();
  }, []);

  return {
    isVisible,
    selectedText,
    bubbleRef,
    containerRef,
    setIsVisible,
    closeBubble,
  };
};
