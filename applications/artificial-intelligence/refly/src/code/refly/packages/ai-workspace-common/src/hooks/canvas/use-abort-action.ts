import { useCallback } from 'react';
import { logEvent } from '@refly/telemetry-web';
import { useActionResultStore } from '@refly/stores';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';

// Global variables shared across all hook instances
export const globalAbortControllerRef = {
  current: null as AbortController | null,
};
export const globalIsAbortedRef = { current: false };
export const globalCurrentResultIdRef = { current: '' as string };

export const useAbortAction = (params?: { source?: string }) => {
  const { source } = params || {};

  const abortAction = useCallback(async (resultId?: string) => {
    // Use current active resultId if none provided
    const activeResultId = resultId || globalCurrentResultIdRef.current;

    const { resultMap } = useActionResultStore.getState();
    const result = resultMap[activeResultId];

    if (!result) {
      return;
    }

    logEvent('model_invoke_abort', Date.now(), {
      resultId: activeResultId,
      source,
      model: result.modelInfo?.name,
      skill: result.actionMeta?.name,
    });

    try {
      // Abort the local controller
      if (globalAbortControllerRef.current) {
        globalAbortControllerRef.current.abort();
        globalIsAbortedRef.current = true;
      } else {
        console.log('No local controller to abort');
      }

      // If resultId is provided and is a valid string, call the backend to clean up server-side resources
      if (activeResultId?.trim()) {
        try {
          await getClient().abortAction({
            body: {
              resultId: result.resultId,
              version: result.version,
            },
          });
        } catch (_error) {
          // Silent fail or minimal logging
          console.warn('Failed to abort action on server');
        }
      } else {
        console.log('No valid resultId provided, skipping backend call');
        console.log('activeResultId details:', {
          activeResultId,
          type: typeof activeResultId,
          isEmpty: !activeResultId,
        });
      }
    } catch (err) {
      console.error('abort error', err);
    }
  }, []);

  return { abortAction };
};
