import { Button } from 'antd';

import { useUserStoreShallow } from '@refly/stores';
import { UILocaleList } from '@refly-packages/ai-workspace-common/components/ui-locale-list';
import { useTranslation } from 'react-i18next';
import { OutputLocaleList } from '../../output-locale-list';
import { LOCALE } from '@refly/common-types';
import { localeToLanguageName } from '@refly-packages/ai-workspace-common/utils/i18n';
import { ContentHeader } from '../contentHeader';
import { ArrowDown } from 'refly-icons';

const LanguageSettingItem = ({
  title,
  description,
  children,
}: { title: string; description: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-refly-text-0 leading-5">{title}</div>
      {children}
      <div className="text-xs text-refly-text-2 leading-4">{description}</div>
    </div>
  );
};

export const LanguageSetting = () => {
  const { localSettings } = useUserStoreShallow((state) => ({
    localSettings: state.localSettings,
  }));

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;
  const outputLocale = localSettings?.outputLocale;

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ContentHeader title={t('settings.tabs.language')} />

      <div className="px-5 py-6 flex flex-col gap-6 w-full h-full box-border overflow-y-auto">
        <LanguageSettingItem
          title={t('settings.language.uiLocale.title')}
          description={t('settings.language.uiLocale.description')}
        >
          <UILocaleList className="w-full">
            <Button className="w-full px-3 justify-between" color="default" variant="filled">
              {t('language')} <ArrowDown size={14} color="var(--refly-text-2)" />
            </Button>
          </UILocaleList>
        </LanguageSettingItem>

        <LanguageSettingItem
          title={t('settings.language.outputLocale.title')}
          description={t('settings.language.outputLocale.description')}
        >
          <OutputLocaleList>
            <Button className="w-full px-3 justify-between" color="default" variant="filled">
              {localeToLanguageName?.[uiLocale]?.[outputLocale]}{' '}
              <ArrowDown size={14} color="var(--refly-text-2)" />
            </Button>
          </OutputLocaleList>
        </LanguageSettingItem>
      </div>
    </div>
  );
};
