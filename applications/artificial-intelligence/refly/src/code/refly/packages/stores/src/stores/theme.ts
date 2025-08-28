import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  // Theme mode
  themeMode: ThemeMode;
  // Whether it's dark mode
  isDarkMode: boolean;
  // Whether user is logged in
  isLoggedIn: boolean;

  // Set theme mode
  setThemeMode: (mode: ThemeMode) => void;
  // Initialize theme
  initTheme: () => void;
  // Set login status
  setLoggedIn: (status: boolean) => void;
}

// Check if system is in dark mode
const isSystemDarkMode = () => {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
};

// Apply dark mode to document
const applyDarkMode = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      isDarkMode: false,
      isLoggedIn: false,

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });

        // Set dark mode status based on mode
        let isDark = false;
        if (mode === 'dark') {
          isDark = true;
        } else if (mode === 'system') {
          isDark = isSystemDarkMode();
        }

        set({ isDarkMode: isDark });
        applyDarkMode(isDark);
      },

      setLoggedIn: (status: boolean) => {
        set({ isLoggedIn: status });
        // Re-initialize theme when login status changes
        setTimeout(() => get().initTheme(), 0);
      },

      initTheme: () => {
        const { themeMode, isLoggedIn } = get();

        // If not logged in, default to light mode
        if (!isLoggedIn) {
          set({ themeMode: 'light', isDarkMode: false });
          applyDarkMode(false);
          return;
        }

        // If logged in, follow stored theme settings
        console.log('initTheme themeMode', themeMode);

        // Initialize based on current theme mode
        let isDark = false;
        if (themeMode === 'dark') {
          isDark = true;
        } else if (themeMode === 'system') {
          isDark = isSystemDarkMode();

          // Listen for system theme changes
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            if (get().themeMode === 'system') {
              set({ isDarkMode: e.matches });
              applyDarkMode(e.matches);
            }
          };

          mediaQuery.addEventListener('change', handleChange);
        }

        set({ isDarkMode: isDark });
        applyDarkMode(isDark);
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        themeMode: state.themeMode,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);

export const useThemeStoreShallow = <T>(selector: (state: ThemeState) => T) => {
  return useThemeStore(useShallow(selector));
};
