import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { enUSUi, enUSSkill, enUSSkillLog } from '@refly/i18n/en-US';
import { zhHansUi, zhHansSkill, zhHansSkillLog } from '@refly/i18n/zh-Hans';

i18next
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
    // if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
    // set returnNull to false (and also in the i18next.d.ts options)
    // returnNull: false,
  });
