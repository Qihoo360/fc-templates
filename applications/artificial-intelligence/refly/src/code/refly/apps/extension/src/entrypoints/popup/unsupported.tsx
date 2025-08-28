import { useTranslation } from 'react-i18next';

export const Unsupported = () => {
  const { t } = useTranslation();
  return (
    <div>
      <p className="content-title">{t('extension.popup.unsupportedTitle')}</p>
      <p className="state">{t('extension.popup.unsupportedDesc')}</p>
      <ul>
        <li>{t('extension.popup.unsupportedPages.chromeStore')}</li>
        <li>{t('extension.popup.unsupportedPages.chromePages')}</li>
        <li>{t('extension.popup.unsupportedPages.newTab')}</li>
      </ul>
      <p className="page-unsupported-hint">
        {t('extension.popup.unsupportedHint')} <span> 👉 </span>
        <a href="https://zh.wikipedia.org/wiki/ChatGPT" target="_blank" rel="noreferrer">
          {t('extension.popup.examplePage')}
        </a>
      </p>
    </div>
  );
};
