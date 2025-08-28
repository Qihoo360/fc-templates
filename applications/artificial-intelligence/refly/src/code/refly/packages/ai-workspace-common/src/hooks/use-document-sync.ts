import { useMemo } from 'react';
import { useDocumentContext } from '@refly-packages/ai-workspace-common/context/document';

export const useDocumentSync = () => {
  const { ydoc, provider } = useDocumentContext();

  const syncFunctions = useMemo(() => {
    const syncTitleToYDoc = (title: string) => {
      if (!ydoc || provider?.status !== 'connected') return;

      try {
        ydoc.transact(() => {
          const yTitle = ydoc.getText('title');
          if (!yTitle) return;

          yTitle.delete(0, yTitle.length ?? 0);
          yTitle.insert(0, title);
        });
      } catch (error) {
        console.error('Transaction error when syncing title:', error);

        if (error instanceof DOMException && error.name === 'InvalidStateError') {
          console.warn('Database connection is closing. Transaction aborted.');
        }
      }
    };

    return {
      syncTitleToYDoc,
    };
  }, [ydoc, provider]);

  return syncFunctions;
};
