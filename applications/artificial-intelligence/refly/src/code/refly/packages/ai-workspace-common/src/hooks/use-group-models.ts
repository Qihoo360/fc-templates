import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type ItemWithGroup = {
  group?: string;
  [key: string]: any;
};

/**
 * Groups provider items by a specific property and creates sorted group entries
 * @param models - List of provider items to group
 * @param groupProperty - The property to group by (defaults to 'group')
 * @param defaultGroupKey - The key to use for items without the group property (defaults to 'default')
 * @returns Sorted group entries with models organized by group
 */
export const useGroupModels = () => {
  const { t } = useTranslation();
  const handleGroupModelList = useCallback(
    <T extends ItemWithGroup>(models: T[]) => {
      const groups: Record<string, T[]> = {};

      for (const model of models) {
        const groupKey = model.group || 'default';
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(model);
      }

      const entries = Object.entries(groups).map(([key, groupModels]) => ({
        key,
        name: key === 'default' ? t('settings.modelConfig.default') : key,
        models: groupModels.sort((a, b) => a.name.localeCompare(b.name)),
        isDefault: key === 'default',
      }));

      return entries.sort((a, b) => {
        if (a.isDefault) return 1;
        if (b.isDefault) return -1;
        return a.name.localeCompare(b.name);
      });
    },
    [t],
  );

  return { handleGroupModelList };
};
