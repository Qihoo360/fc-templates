import { translation } from '../i18n/en/translation';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof translation;
    };
  }
}

const resources = {
  translation,
} as const;

export default resources;
