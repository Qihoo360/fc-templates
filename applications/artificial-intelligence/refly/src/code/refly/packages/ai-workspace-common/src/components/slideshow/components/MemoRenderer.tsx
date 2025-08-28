import { memo } from 'react';
import { type NodeRelation } from './ArtifactRenderer';
import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';

const MemoRenderer = memo(
  ({
    node,
    isFullscreen = false,
    isMinimap = false,
  }: {
    node: NodeRelation;
    isFullscreen?: boolean;
    isMinimap?: boolean;
  }) => {
    return (
      <div
        className={`h-full bg-white ${!isFullscreen ? 'rounded' : 'w-full'} ${
          isMinimap ? 'p-1' : ''
        }`}
      >
        <div className="h-full w-full overflow-auto">
          <Markdown content={node.nodeData?.contentPreview} className="p-4" />
        </div>
      </div>
    );
  },
);

export { MemoRenderer };
