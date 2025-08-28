import { memo, useMemo, CSSProperties } from 'react';
import { type NodeRelation } from './ArtifactRenderer';
import { NodeBlockHeader } from './NodeBlockHeader';
import {
  LazyCodeArtifactRenderer,
  LazyDocumentRenderer,
  LazySkillResponseRenderer,
  LazyImageRenderer,
  WithSuspense,
  LazyMemoRenderer,
  LazyResourceRenderer,
  LazyWebsiteRenderer,
} from './LazyComponents';
import { useTranslation } from 'react-i18next';

// Create a generic content container component to reduce code duplication
const ContentContainer = ({
  children,
  isFullscreen = false,
  isFocused = false,
  isMinimap = false,
  isModal = false,
}: {
  children: React.ReactNode;
  isFullscreen?: boolean;
  isFocused?: boolean;
  isMinimap?: boolean;
  isModal?: boolean;
}) => {
  // Content container style
  const contentStyle: CSSProperties = {
    overflow: 'auto',
    flex: 1,
    height: isFullscreen ? '100%' : undefined,
    position: 'relative',
  };

  // Overlay style
  const overlayStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    background: 'transparent',
    cursor: 'pointer',
  };

  return (
    <div style={contentStyle}>
      {children}

      {/* Transparent overlay to prevent scrolling when not focused */}
      {!isFocused && !isFullscreen && !isMinimap && !isModal && <div style={overlayStyle} />}
    </div>
  );
};

// Content renderer component
const NodeRenderer = memo(
  ({
    node,
    isFullscreen = false,
    isModal = false,
    isMinimap = false,
    isFocused = false,
    onDelete,
    onStartSlideshow,
    onWideMode,
  }: {
    node: NodeRelation;
    isFullscreen?: boolean;
    isModal?: boolean;
    isMinimap?: boolean;
    isFocused?: boolean;
    onDelete?: (nodeId: string) => void;
    onStartSlideshow?: (nodeId: string) => void;
    onWideMode?: (nodeId: string) => void;
  }) => {
    const { t } = useTranslation();

    // Generic node block header
    const renderNodeHeader =
      !isFullscreen && !isModal ? (
        <NodeBlockHeader
          node={node}
          isMinimap={isMinimap}
          onMaximize={() => onStartSlideshow?.(node.nodeId)}
          onWideMode={() => onWideMode?.(node.nodeId)}
          onDelete={onDelete}
        />
      ) : null;

    // Use useMemo to cache rendered content, avoiding unnecessary recalculations
    const renderContent = useMemo(() => {
      // Return appropriate renderer based on node type
      switch (node.nodeType) {
        case 'codeArtifact':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazyCodeArtifactRenderer
                    node={node}
                    isFullscreen={isFullscreen}
                    isMinimap={isMinimap}
                  />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        case 'document':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazyDocumentRenderer
                    node={node}
                    isFullscreen={isFullscreen}
                    isMinimap={isMinimap}
                  />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        case 'skillResponse':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazySkillResponseRenderer
                    node={node}
                    isFullscreen={isFullscreen}
                    isMinimap={isMinimap}
                  />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        case 'image':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazyImageRenderer
                    node={node}
                    isFullscreen={isFullscreen}
                    isMinimap={isMinimap}
                  />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        case 'memo':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazyMemoRenderer node={node} isFullscreen={isFullscreen} isMinimap={isMinimap} />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        case 'resource':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazyResourceRenderer
                    node={node}
                    isFullscreen={isFullscreen}
                    isMinimap={isMinimap}
                  />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        case 'website':
          return (
            <div className="flex flex-col h-full">
              {renderNodeHeader}
              <ContentContainer
                isFullscreen={isFullscreen}
                isFocused={isFocused}
                isMinimap={isMinimap}
                isModal={isModal}
              >
                <WithSuspense>
                  <LazyWebsiteRenderer
                    node={node}
                    isFullscreen={isFullscreen}
                    isMinimap={isMinimap}
                  />
                </WithSuspense>
              </ContentContainer>
            </div>
          );
        default:
          // Display message for unsupported types
          return (
            <div
              className={`p-6 bg-white rounded-lg flex flex-col items-center justify-center text-gray-400 ${
                !isFullscreen ? 'h-[400px]' : 'h-full'
              } shadow-refly-m ${isMinimap ? 'p-2 h-full' : ''}`}
            >
              <div className={`${isMinimap ? 'text-xs' : 'text-lg'}`}>
                {isMinimap
                  ? t('pages.components.nodeRenderer.unsupportedComponent')
                  : t('pages.components.nodeRenderer.onlyCodeComponentSupported')}
              </div>
              {!isMinimap && <div className="text-sm text-gray-400 mt-2">{node.nodeType}</div>}
            </div>
          );
      }
    }, [
      node,
      isFullscreen,
      isModal,
      isMinimap,
      isFocused,
      onDelete,
      onStartSlideshow,
      onWideMode,
      t,
      renderNodeHeader,
    ]);

    return renderContent;
  },
  // Custom comparison function, only re-render when key properties change
  (prevProps, nextProps) => {
    // Check if key properties have changed
    return (
      prevProps.node.nodeId === nextProps.node.nodeId &&
      prevProps.node.nodeType === nextProps.node.nodeType &&
      prevProps.isFullscreen === nextProps.isFullscreen &&
      prevProps.isModal === nextProps.isModal &&
      prevProps.isMinimap === nextProps.isMinimap &&
      prevProps.isFocused === nextProps.isFocused
    );
  },
);

export { NodeRenderer };
