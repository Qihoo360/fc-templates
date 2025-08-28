import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  FullscreenOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { type NodeRelation } from './ArtifactRenderer';
import { NodeRenderer } from './NodeRenderer';

interface OptimizedPreviewModeProps {
  nodes: NodeRelation[];
  currentSlideIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  showUI: boolean;
  showMinimap: boolean;
  onMinimapMouseEnter: () => void;
  onMinimapMouseLeave: () => void;
  onSlideSelect: (index: number) => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

// Helper function to get node title
const getNodeTitle = (node: NodeRelation) => {
  return (
    node.nodeData?.title ||
    `${node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)} ${node.nodeId.slice(0, 6)}`
  );
};

// Optimized preview mode component
export const OptimizedPreviewMode: React.FC<OptimizedPreviewModeProps> = ({
  nodes,
  currentSlideIndex,
  onNext,
  onPrev,
  onClose,
  onMouseMove,
  showUI,
  showMinimap,
  onMinimapMouseEnter,
  onMinimapMouseLeave,
  onSlideSelect,
  contentRef,
}) => {
  // Track which thumbnails have been viewed
  const [viewedThumbnails, setViewedThumbnails] = useState<Record<number, boolean>>({});

  // Preload next slide state
  const [preloadIndex, setPreloadIndex] = useState<number | null>(null);

  // Preload next slide when current slide changes
  useEffect(() => {
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < nodes.length) {
      setPreloadIndex(nextIndex);
    } else if (currentSlideIndex > 0) {
      setPreloadIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex, nodes.length]);

  // Record when thumbnails are visible
  const handleThumbnailVisible = useCallback((index: number) => {
    setViewedThumbnails((prev) => ({
      ...prev,
      [index]: true,
    }));
  }, []);

  // Optimization: only render current slide and preloaded slide
  const visibleSlides = useMemo(() => {
    const result: Record<number, boolean> = {
      [currentSlideIndex]: true,
    };

    if (preloadIndex !== null) {
      result[preloadIndex] = true;
    }

    return result;
  }, [currentSlideIndex, preloadIndex]);

  return (
    <div
      className="h-full w-full flex flex-col bg-black relative"
      onMouseMove={onMouseMove}
      ref={contentRef}
    >
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center relative">
        {nodes.map((node, index) => (
          <div
            key={node.nodeId}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{ display: visibleSlides[index] ? 'flex' : 'none' }}
          >
            {visibleSlides[index] && (
              <NodeRenderer node={node} isFullscreen={true} isMinimap={false} />
            )}
          </div>
        ))}
      </div>

      {/* Lazy load slide content component */}
      {showUI && (
        <>
          {/* Navigation controls */}
          <div
            className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center transition-opacity duration-300 ${
              showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              className="text-white border-none bg-transparent hover:bg-gray-800"
            />
            <div className="text-white text-lg">
              {currentSlideIndex + 1} / {nodes.length}
            </div>
            <Button
              icon={<FullscreenOutlined />}
              className="text-white border-none bg-transparent hover:bg-gray-800"
            />
          </div>

          {/* Prev/Next buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            {currentSlideIndex > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onPrev}
                className="ml-4 text-white border-none bg-transparent hover:bg-gray-800"
              />
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            {currentSlideIndex < nodes.length - 1 && (
              <Button
                icon={<ArrowRightOutlined />}
                onClick={onNext}
                className="mr-4 text-white border-none bg-transparent hover:bg-gray-800"
              />
            )}
          </div>
        </>
      )}

      {/* Optimization: only render thumbnails when minimap is open */}
      {showMinimap && (
        <div
          className="absolute top-0 left-0 bottom-0 w-64 bg-gray-900 overflow-y-auto transition-transform duration-300 transform"
          style={{ transform: showMinimap ? 'translateX(0)' : 'translateX(-100%)' }}
          onMouseEnter={onMinimapMouseEnter}
          onMouseLeave={onMinimapMouseLeave}
        >
          {nodes.map((node, index) => {
            // Determine if thumbnail content should be rendered
            const shouldRenderContent = viewedThumbnails[index] || index === currentSlideIndex;

            return (
              <div
                key={node.nodeId}
                className={`p-2 cursor-pointer ${
                  index === currentSlideIndex ? 'bg-gray-700' : 'hover:bg-gray-800'
                }`}
                onClick={() => onSlideSelect(index)}
                onMouseEnter={() => handleThumbnailVisible(index)}
              >
                <div className="text-white text-xs mb-1 truncate">
                  {index + 1}. {getNodeTitle(node)}
                </div>
                <div className="h-24 bg-black rounded overflow-hidden">
                  {shouldRenderContent ? (
                    <div className="h-full w-full transform scale-[0.2] origin-top-left">
                      <div className="transform scale-[5] h-full w-full">
                        <NodeRenderer node={node} isFullscreen={false} isMinimap={true} />
                      </div>
                    </div>
                  ) : (
                    // Use placeholder instead of actual content
                    <div className="h-full w-full flex items-center justify-center bg-gray-800">
                      <MenuOutlined className="text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side hint for minimap */}
      {!showMinimap && showUI && (
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
          <div
            className="w-6 h-24 bg-gray-800 rounded-r flex items-center justify-center cursor-pointer hover:bg-gray-700"
            onMouseEnter={onMinimapMouseEnter}
          >
            <MenuOutlined className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
