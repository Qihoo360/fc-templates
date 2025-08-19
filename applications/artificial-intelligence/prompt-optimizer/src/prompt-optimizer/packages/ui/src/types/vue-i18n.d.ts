import 'vue-i18n'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    common: {
      appName: string;
      loading: string;
      save: string;
      cancel: string;
      confirm: string;
      delete: string;
      edit: string;
      create: string;
      search: string;
      settings: string;
      language: string;
      templates: string;
      history: string;
      close: string;
      test: string;
      enable: string;
      disable: string;
      enabled: string;
      disabled: string;
      add: string;
      description: string;
      lastModified: string;
      noDescription: string;
      builtin: string;
      currentTemplate: string;
      use: string;
      expand: string;
      collapse: string;
      clear: string;
      createdAt: string;
      version: string;
      iterate: string;
    };
    nav: {
      home: string;
      dashboard: string;
      promptOptimizer: string;
      settings: string;
    };
    promptOptimizer: {
      title: string;
      inputPlaceholder: string;
      optimize: string;
      history: string;
      save: string;
      share: string;
      export: string;
      originalPrompt: string;
      optimizeModel: string;
      templateLabel: string;
    };
    settings: {
      title: string;
      language: string;
      theme: string;
      apiSettings: string;
      about: string;
    };
    modelManager: {
      title: string;
      modelList: string;
      testConnection: string;
      editModel: string;
      deleteModel: string;
      displayName: string;
      modelKey: string;
      apiUrl: string;
      defaultModel: string;
      apiKey: string;
      useVercelProxy: string;
      useVercelProxyHint: string;
      addModel: string;

      // Placeholders
      modelKeyPlaceholder: string;
      displayNamePlaceholder: string;
      apiUrlPlaceholder: string;
      defaultModelPlaceholder: string;
      apiKeyPlaceholder: string;

      // Confirmation
      deleteConfirm: string;

      // Operation Results
      testSuccess: string;
      testFailed: string;
      updateSuccess: string;
      updateFailed: string;
      addSuccess: string;
      addFailed: string;
      enableSuccess: string;
      enableFailed: string;
      disableSuccess: string;
      disableFailed: string;
      deleteSuccess: string;
      deleteFailed: string;

      // Accessibility Labels
      testConnectionAriaLabel: string;
      editModelAriaLabel: string;
      enableModelAriaLabel: string;
      disableModelAriaLabel: string;
      deleteModelAriaLabel: string;
      displayNameAriaLabel: string;
      apiUrlAriaLabel: string;
      defaultModelAriaLabel: string;
      apiKeyAriaLabel: string;
      useVercelProxyAriaLabel: string;
      cancelEditAriaLabel: string;
      saveEditAriaLabel: string;
      cancelAddAriaLabel: string;
      confirmAddAriaLabel: string;
    };
    templateManager: {
      title: string;
      optimizeTemplates: string;
      iterateTemplates: string;
      optimizeTemplateList: string;
      iterateTemplateList: string;
      addTemplate: string;
      editTemplate: string;
      deleteTemplate: string;
      templateCount: string;

      // Button Text
      importTemplate: string;
      exportTemplate: string;
      copyTemplate: string;
      useTemplate: string;
      viewTemplate: string;

      // Form Fields
      name: string;
      content: string;
      description: string;
      type: string;

      // Placeholders
      namePlaceholder: string;
      contentPlaceholder: string;
      descriptionPlaceholder: string;
      searchPlaceholder: string;

      // Confirmation
      deleteConfirm: string;

      // Operation Results
      updateSuccess: string;
      updateFailed: string;
      addSuccess: string;
      addFailed: string;
      deleteSuccess: string;
      deleteFailed: string;
      copySuccess: string;
      copyFailed: string;
      importSuccess: string;
      importFailed: string;
      exportSuccess: string;
      exportFailed: string;

      // Accessibility Labels
      editTemplateAriaLabel: string;
      deleteTemplateAriaLabel: string;
      nameAriaLabel: string;
      contentAriaLabel: string;
      descriptionAriaLabel: string;
      typeAriaLabel: string;
      searchAriaLabel: string;
      cancelEditAriaLabel: string;
      saveEditAriaLabel: string;
      cancelAddAriaLabel: string;
      confirmAddAriaLabel: string;
      importTemplateAriaLabel: string;
      exportTemplateAriaLabel: string;
      copyTemplateAriaLabel: string;
      useTemplateAriaLabel: string;
      viewTemplateAriaLabel: string;
    };
    history: {
      title: string;
      iterationNote: string;
      optimizedPrompt: string;
    };
  }
  export function useI18n(): {
    t: (key: string, ...args: any[]) => string;
  }
} 