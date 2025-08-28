import React, { type ReactNode, useRef, useCallback } from 'react';
import Tippy from '@tippyjs/react';
import type { TippyProps } from '@tippyjs/react';
import { useSelectionBubble } from '../use-selection-bubble';
import { GetReferenceClientRect } from 'tippy.js';

interface SelectionBubbleProps {
  containerClass?: string;
  containerRef?: React.RefObject<HTMLElement>;
  children: ReactNode;
  onSelect?: (selectedText: string) => void;
  enabled?: boolean;
  placement?: TippyProps['placement'];
  offset?: [number, number];
  getPosition?: () => { x: number; y: number; width: number; height: number } | null;
}

export const SelectionBubble: React.FC<SelectionBubbleProps> = ({
  containerClass,
  containerRef: externalContainerRef,
  children,
  onSelect,
  enabled = true,
  placement = 'top',
  offset = [0, 10],
  getPosition,
}) => {
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  const { isVisible, selectedText, bubbleRef, closeBubble } = useSelectionBubble({
    containerClass,
    containerRef: externalContainerRef,
    onSelect,
    enabled,
  });

  const getReferenceClientRect = useCallback(() => {
    if (getPosition) {
      const pos = getPosition();
      if (pos) return pos;
    }

    const selection = window.getSelection();
    if (!selection?.rangeCount) {
      return {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
      };
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const reactFlowWrapper = document.querySelector('.react-flow-wrapper');
      const wrapperRect = reactFlowWrapper?.getBoundingClientRect();

      if (wrapperRect) {
        return {
          width: rect.width,
          height: rect.height,
          top: rect.top - wrapperRect.top,
          left: rect.left - wrapperRect.left,
          right: rect.right - wrapperRect.left,
          bottom: rect.bottom - wrapperRect.top,
          x: rect.left - wrapperRect.left,
          y: rect.top - wrapperRect.top,
        };
      }

      return rect;
    } catch (error) {
      console.error('Error getting selection position:', error);
      return {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
      };
    }
  }, [getPosition]);

  // 包装 children 以处理点击事件
  const wrappedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onClick: async (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          if (child.props.onClick) {
            await child.props.onClick(e);
          }

          closeBubble();
        },
      });
    }
    return child;
  });

  return (
    <div
      ref={bubbleContainerRef}
      className="selection-bubble-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 99999,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {isVisible && selectedText && (
        <Tippy
          ref={bubbleRef as React.RefObject<any>}
          content={wrappedChildren}
          visible={true}
          interactive
          animation="scale-subtle"
          placement={placement}
          offset={offset}
          getReferenceClientRect={getReferenceClientRect as GetReferenceClientRect}
          appendTo={() => bubbleContainerRef.current || document.body}
          className="selection-bubble-menu"
          zIndex={99999}
          popperOptions={{
            strategy: 'fixed',
          }}
        >
          <div className="selection-bubble-anchor" style={{ pointerEvents: 'none' }} />
        </Tippy>
      )}
    </div>
  );
};
