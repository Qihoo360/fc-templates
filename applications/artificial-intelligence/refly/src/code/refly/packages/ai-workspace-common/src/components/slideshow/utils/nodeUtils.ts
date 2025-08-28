import { type NodeRelation } from '../components/ArtifactRenderer';
import i18next from 'i18next';

/**
 * Get node title
 * @param node Node relation object
 * @returns Node title
 */
export const getNodeTitle = (node: NodeRelation): string => {
  // Try to get title from nodeData.title
  if (node.nodeData?.title) return node.nodeData.title;

  // Try to get title from nodeData.metadata.title
  if (node.nodeData?.metadata?.title) return node.nodeData.metadata.title;

  // Return default title based on node type
  if (node.nodeType === 'codeArtifact') return i18next.t('pages.components.codeComponent');
  if (node.nodeType === 'document') return i18next.t('pages.components.documentComponent');
  if (node.nodeType === 'skillResponse') return i18next.t('pages.components.skillResponse');

  return i18next.t('pages.components.slide', { index: node.orderIndex + 1 });
};
