import { useUpdateSettings } from '@refly-packages/ai-workspace-common/queries';
import { useUserStore, useUserStoreShallow } from '@refly/stores';

export const useHoverCard = () => {
  const { localSettings, setLocalSettings } = useUserStoreShallow((state) => ({
    localSettings: state.localSettings,
    setLocalSettings: state.setLocalSettings,
  }));
  const { mutate: updateSettings } = useUpdateSettings();

  const toggleHoverCard = (enabled: boolean) => {
    const { localSettings } = useUserStore.getState();
    setLocalSettings({
      ...localSettings,
      disableHoverCard: !enabled,
    });
    updateSettings({
      body: {
        preferences: {
          disableHoverCard: !enabled,
        },
      },
    });
  };

  return {
    hoverCardEnabled: !localSettings.disableHoverCard,
    toggleHoverCard,
  };
};
