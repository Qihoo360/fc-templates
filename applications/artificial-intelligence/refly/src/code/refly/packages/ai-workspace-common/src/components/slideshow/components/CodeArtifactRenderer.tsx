import { memo } from 'react';
import { ArtifactRenderer, type NodeRelation } from './ArtifactRenderer';

// For backward compatibility, keeping the original component name but using the unified component
const CodeArtifactRenderer = memo(
  (props: {
    node: NodeRelation;
    isFullscreen?: boolean;
    isMinimap?: boolean;
  }) => {
    return (
      <ArtifactRenderer
        node={props.node}
        type="code"
        isFullscreen={props.isFullscreen}
        isMinimap={props.isMinimap}
      />
    );
  },
);

CodeArtifactRenderer.displayName = 'CodeArtifactRenderer';

export { CodeArtifactRenderer };
