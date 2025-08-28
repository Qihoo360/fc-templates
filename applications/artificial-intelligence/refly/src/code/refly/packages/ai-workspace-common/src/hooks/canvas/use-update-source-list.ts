import { useGetProjectCanvasId } from '@refly-packages/ai-workspace-common/hooks/use-get-project-canvasId';
import { SourceObject, useSiderStoreShallow } from '@refly/stores';
import { Resource, Document } from '@refly/openapi-schema';
import { useCallback } from 'react';

export const useUpdateSourceList = () => {
  const { projectId: currentProjectId } = useGetProjectCanvasId();
  const { sourceList, setSourceList } = useSiderStoreShallow((state) => ({
    sourceList: state.sourceList,
    setSourceList: state.setSourceList,
  }));

  const updateSourceList = useCallback(
    (addedList: Document[] | Resource[], projectId?: string) => {
      if (currentProjectId === projectId) {
        const newSourceList: SourceObject[] = addedList.map((source) => ({
          ...source,
          id: 'resourceId' in source ? source.resourceId : source.docId,
          type: 'resource' as const,
          name: source.title,
        }));
        setSourceList([...newSourceList, ...sourceList]);
      }
    },
    [currentProjectId, sourceList, setSourceList],
  );

  return { sourceList, updateSourceList };
};
