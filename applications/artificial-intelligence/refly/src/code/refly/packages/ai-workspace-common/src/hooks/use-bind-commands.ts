import { useEffect } from 'react';
import hotKeys from 'hotkeys-js';
import { useIsLogin } from './use-is-login';
import { useSearchStoreShallow } from '@refly/stores';

export const useBindCommands = () => {
  const searchStore = useSearchStoreShallow((state) => ({
    setIsSearchOpen: state.setIsSearchOpen,
  }));
  const { isLoggedRef } = useIsLogin();

  const handleBindHotkey = () => {
    hotKeys('command+k, ctrl+k', () => {
      console.log('hit hotkey');

      // Don't do anything if not logged in
      if (!isLoggedRef.current) {
        return;
      }

      searchStore.setIsSearchOpen(true);
    });
  };

  useEffect(() => {
    handleBindHotkey();

    return () => {};
  }, []);
};
