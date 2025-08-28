import { SkillResponseTopButtons } from './skill-response-top-buttons';
import { CodeArtifactTopButtons } from './code-artifact-top-buttons';
import { useActiveNode } from '@refly/stores';
import { DocumentTopButtons } from './document-top-buttons';
import { ResourceTopButtons } from './resource-top-buttons';
import { useCanvasContext } from '@refly-packages/ai-workspace-common/context/canvas';

export const TopButtons = () => {
  const { canvasId } = useCanvasContext();
  const { activeNode } = useActiveNode(canvasId);

  switch (activeNode?.type) {
    case 'skillResponse':
      return <SkillResponseTopButtons node={activeNode} />;
    case 'codeArtifact':
      return <CodeArtifactTopButtons />;
    case 'document':
      return <DocumentTopButtons />;
    case 'resource':
      return <ResourceTopButtons />;
    default:
      return null;
  }
};
