import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Page } from '../../server/pages';
import { api } from '../api';
import { PageAutosave } from './autosave';
export function usePageAutosave(page: Page, onSaved: (page: Page) => void) {
  const [controller] = useState(() => {
    const instance = new PageAutosave(async (id, patch, signal) => {
      const result = await api<Page>(
        `/spaces/${page.spaceId}/pages/${id}`,
        'PATCH',
        patch,
        signal,
      );
      onSaved(result);
      return result;
    });
    instance.receive(page);
    return instance;
  });
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => controller.receive(page), [controller, page]);
  useEffect(() => () => controller.dispose(), [controller]);
  return { controller, state };
}
