import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { enUSUi, enUSSkill, enUSSkillLog } from '@refly/i18n/en-US';
import { zhHansUi, zhHansSkill, zhHansSkillLog } from '@refly/i18n/zh-Hans';

export const setupI18n = () => {
  return i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: process.env.NODE_ENV === 'development',
      defaultNS: 'ui',
      resources: {
        en: {
          ui: enUSUi,
          skill: enUSSkill,
          skillLog: enUSSkillLog,
        },
        'zh-CN': {
          ui: zhHansUi,
          skill: zhHansSkill,
          skillLog: zhHansSkillLog,
        },
        zh: {
          ui: zhHansUi,
          skill: zhHansSkill,
          skillLog: zhHansSkillLog,
        },
      },
    });
};
