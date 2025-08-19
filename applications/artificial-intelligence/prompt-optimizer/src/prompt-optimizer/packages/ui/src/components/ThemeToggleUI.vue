<template>
  <div class="relative">
    <button
      @click="toggleThemeMenu" 
      class="theme-icon-button"
    >
      <span class="text-base sm:text-lg inline-flex items-center align-middle">
        <svg v-if="currentTheme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="currentTheme === 'light'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
        <svg v-else-if="currentTheme === 'blue'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="currentTheme === 'green'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="currentTheme === 'purple'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
        </svg>
      </span>
      <span class="text-sm max-md:hidden truncate">{{ getThemeDisplayName }}</span>
    </button>

    <!-- Theme Selection Dropdown Menu -->
    <div v-if="showThemeMenu" class="absolute right-0 mt-2 min-w-[132px] theme-dropdown z-50">
      <div class="py-1">
        <button 
          v-for="theme in availableThemes" 
          :key="theme.id"
          @click="selectTheme(theme.id)"
          class="w-full text-left px-4 py-2 flex items-center gap-2 theme-dropdown-item"
          :class="currentTheme === theme.id ? 'theme-dropdown-item-active' : 'theme-dropdown-item-inactive'"
        >
          <span class="w-5 h-5 flex-shrink-0" :class="theme.iconClass">
            <svg v-if="theme.id === 'light'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="theme.id === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            <svg v-else-if="theme.id === 'blue'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="theme.id === 'green'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="theme.id === 'purple'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </span>
          <span>{{ theme.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePreferences } from '../composables/usePreferenceManager';
import { UI_SETTINGS_KEYS } from '@prompt-optimizer/core';
import type { Ref } from 'vue';
import type { AppServices } from '../types/services';

const { t } = useI18n();
const services = inject<Ref<AppServices | null>>('services')!;
const { getPreference, setPreference } = usePreferences(services);

// Available themes list
const availableThemes = computed(() => [
  {
    id: 'light',
    name: t('theme.light'),
    iconClass: 'text-yellow-500',
    cssClass: ''
  },
  {
    id: 'dark',
    name: t('theme.dark'),
    iconClass: 'text-gray-400',
    cssClass: 'dark'
  },
  {
    id: 'blue',
    name: t('theme.blue'),
    iconClass: 'text-blue-500',
    cssClass: 'theme-blue'
  },
  {
    id: 'green',
    name: t('theme.green'),
    iconClass: 'text-green-500',
    cssClass: 'theme-green'
  },
  {
    id: 'purple',
    name: t('theme.purple'),
    iconClass: 'text-purple-500',
    cssClass: 'theme-purple'
  }
]);

const currentTheme = ref('light');
const showThemeMenu = ref(false);

// Toggle theme menu display state
const toggleThemeMenu = () => {
  showThemeMenu.value = !showThemeMenu.value;
};

// Select theme
const selectTheme = async (themeId: string) => {
  currentTheme.value = themeId;
  showThemeMenu.value = false;
  await updateTheme();
};

// Update theme
const updateTheme = async () => {
  // Get current theme
  const theme = availableThemes.value.find(t => t.id === currentTheme.value);
  if (!theme) return;
  
  // Get current active theme class
  const activeThemeClass = Array.from(document.documentElement.classList)
    .find(cls => ['dark', 'theme-blue', 'theme-green', 'theme-purple'].includes(cls));
  
  // Remove current theme class if exists
  if (activeThemeClass) {
    document.documentElement.classList.remove(activeThemeClass);
  }
  
  // Add new theme class if exists
  if (theme.cssClass) {
    document.documentElement.classList.add(theme.cssClass);
  }

  // Update data-theme attribute
  document.documentElement.setAttribute('data-theme', theme.id);
  
  try {
    await setPreference(UI_SETTINGS_KEYS.THEME_ID, theme.id);
  } catch (error) {
    console.error('保存主题设置失败:', error);
  }

  // Trigger re-render
  nextTick(() => {
    window.dispatchEvent(new Event('theme-changed'));
  });
};

// Get theme display name
const getThemeDisplayName = computed(() => {
  const theme = availableThemes.value.find(t => t.id === currentTheme.value);
  return theme ? theme.name : t('theme.title');
});

// Close dropdown menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (showThemeMenu.value && target && !target.closest('.relative')) {
    showThemeMenu.value = false;
  }
};

// Initialize theme
onMounted(async () => {
  // Ensure DOM is loaded before applying theme
  requestAnimationFrame(async () => {
    try {
      const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const themeId = await getPreference(UI_SETTINGS_KEYS.THEME_ID, defaultTheme);
      
      // Set current theme
      if (availableThemes.value.find(t => t.id === themeId)) {
        currentTheme.value = themeId;
      } else {
        currentTheme.value = defaultTheme;
      }
      
      // Apply theme
      await updateTheme();
    } catch (error) {
      console.error('初始化主题失败:', error);
      // Fallback to default theme
      currentTheme.value = 'light';
      await updateTheme();
    }
  });
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = async (e: MediaQueryListEvent) => {
    // Only respond to system theme changes when no user theme is set
    try {
      const userTheme = await getPreference(UI_SETTINGS_KEYS.THEME_ID, null);
      if (!userTheme) {
        currentTheme.value = e.matches ? 'dark' : 'light';
        await updateTheme();
      }
    } catch (error) {
      console.error('处理系统主题变化失败:', error);
    }
  };
  
  // Add event listener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else if (mediaQuery.addListener) { // Compatibility for older browsers
    mediaQuery.addListener(handleChange);
  }
  
  // Add click outside event listener to close dropdown menu
  document.addEventListener('click', handleClickOutside);
});

// Remove event listener before component unmount
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>