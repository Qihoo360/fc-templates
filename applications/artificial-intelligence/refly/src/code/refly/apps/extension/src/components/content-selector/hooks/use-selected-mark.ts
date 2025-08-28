import { useContentSelectorStore } from '../stores/content-selector';
import { sendMessage } from '@refly-packages/ai-workspace-common/utils/extension/messaging';
import { getRuntime } from '@refly/utils/env';
import type { SyncMarkEvent, SyncStatusEvent } from '@refly/common-types';

export const useSelectedMark = () => {
  const contentSelectorStore = useContentSelectorStore((state) => ({
    marks: state.marks,
    setMarks: state.setMarks,
    resetState: state.resetState,
    setShowContentSelector: state.setShowContentSelector,
  }));

  const handleInitContentSelectorListener = () => {
    const { scope } = useContentSelectorStore.getState();
    contentSelectorStore.setShowContentSelector(true);
    const runtime = getRuntime();

    const event: SyncStatusEvent = {
      name: 'syncMarkStatusEvent',
      body: {
        type: 'start',
        scope,
      },
    };

    sendMessage({
      ...event,
      source: runtime,
    });
  };

  const handleStopContentSelectorListener = () => {
    const { scope } = useContentSelectorStore.getState();
    contentSelectorStore.setShowContentSelector(false);

    const event: SyncStatusEvent = {
      name: 'syncMarkStatusEvent',
      body: {
        type: 'stop',
        scope,
      },
    };
    sendMessage({
      ...event,
      source: getRuntime(),
    });
  };

  const handleRemoveMark = (xPath: string) => {
    const { marks } = useContentSelectorStore.getState();
    const mark = marks.find((item) => item?.xPath === xPath);
    const event: SyncMarkEvent = { body: { type: 'remove', mark }, name: 'syncMarkEventBack' };
    sendMessage({
      ...event,
      source: getRuntime(),
    });

    const newMarks = marks.filter((item) => item?.xPath !== xPath);
    contentSelectorStore.setMarks(newMarks);
  };

  const handleRemoveAllMarks = () => {
    const event: SyncMarkEvent = { body: { type: 'reset' }, name: 'syncMarkEventBack' };
    contentSelectorStore.setMarks([]);
    sendMessage({
      ...event,
      source: getRuntime(),
    });
  };

  const handleReset = () => {
    const { scope } = useContentSelectorStore.getState();
    contentSelectorStore.setShowContentSelector(false);

    const event: SyncStatusEvent = {
      name: 'syncMarkStatusEvent',
      body: {
        type: 'reset',
        scope,
      },
    };
    sendMessage({
      ...event,
      source: getRuntime(),
    });

    handleRemoveAllMarks();
    contentSelectorStore.resetState();
  };

  return {
    handleInitContentSelectorListener,
    handleStopContentSelectorListener,
    handleReset,
    handleRemoveAllMarks,
    handleRemoveMark,
  };
};
