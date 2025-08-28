import { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStoreShallow, useUserStoreShallow } from '@refly/stores';
import { Logo } from '@refly-packages/ai-workspace-common/components/common/logo';
import { Button } from 'antd';

// Local storage key for tracking if the modal has been shown
const CREDITS_WELCOME_SHOWN_KEY = '__REFLY_CREDITS_WELCOME_SHOWN';

// Configuration for external URLs
const EXTERNAL_URLS = {
  creditUsageGuide: {
    en: 'https://docs.refly.ai/cloud/credit-usage-guide',
    zh: 'https://docs.refly.ai/zh/cloud/credit-usage-guide',
  },
} as const;

// Glassmorphism styles
const glassmorphismStyles = `
  .glassmorphism-modal .ant-modal-content {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  .glassmorphism-modal .ant-modal-body {
    border-radius: 20px !important;
    border: 0.5px solid var(--border---refly-Card-Border, rgba(0, 0, 0, 0.10)) !important;
    background: var(--bg---refly-bg-Glass-content, rgba(255, 255, 255, 0.90)) !important;
    box-shadow: var(--sds-size-depth-0) 6px 60px 0 rgba(0, 0, 0, 0.08) !important;
    backdrop-filter: blur(20px) !important;
  }
  
  .dark .glassmorphism-modal .ant-modal-body {
    background: var(--bg---refly-bg-Glass-content-dark, rgba(30, 30, 30, 0.90)) !important;
    border: 0.5px solid var(--border---refly-Card-Border-dark, rgba(255, 255, 255, 0.10)) !important;
  }
`;

// Helper function to get localized URL
const getLocalizedUrl = (urlConfig: Record<string, string>, currentLanguage: string): string => {
  const isChinese = currentLanguage === 'zh' || currentLanguage.startsWith('zh-');
  return isChinese ? urlConfig.zh : urlConfig.en;
};

export const CreditWelcomeModal = () => {
  const [visible, setVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const { userProfile } = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
  }));

  const isEarlyBirdUser = userProfile?.subscription?.lookupKey === 'refly_max_yearly_limited_offer';

  const { setSubscribeModalVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
    setPlanType: state.setPlanType,
    planType: state.planType,
  }));

  useEffect(() => {
    // Check if user is logged in and if this is the first time showing the modal
    if (userProfile?.uid) {
      const hasShown = localStorage.getItem(CREDITS_WELCOME_SHOWN_KEY);
      if (!hasShown) {
        setVisible(true);
      }
    }
  }, [userProfile?.uid]);

  // Close modal and mark as shown
  const handleClose = () => {
    localStorage.setItem(CREDITS_WELCOME_SHOWN_KEY, 'true');
    setVisible(false);
  };

  // Learn more button click handler
  const handleLearnMore = () => {
    if (isEarlyBirdUser) {
      // Navigate to credit usage guide based on i18n language
      const creditUsageGuideUrl = getLocalizedUrl(EXTERNAL_URLS.creditUsageGuide, i18n.language);
      window.open(creditUsageGuideUrl, '_blank');
    } else {
      // Can navigate to points system details page
      setSubscribeModalVisible(true);
    }
    handleClose();
  };

  return (
    <>
      <style>{glassmorphismStyles}</style>
      <Modal
        open={visible}
        footer={null}
        closable={false}
        centered
        width={600}
        styles={{
          body: {
            padding: '20px 16px',
          },
        }}
        maskClosable={false}
        className="glassmorphism-modal"
      >
        {isEarlyBirdUser ? (
          <div className="flex flex-col items-start w-full p-0 dark:bg-transparent bg-transparent">
            {/* Logo container */}
            <div className="w-full flex justify-start mb-4">
              <Logo />
            </div>

            {/* Title section */}
            <div
              className="mt-[16px]
                  [font-family:'PingFang_SC'] text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-white text-[22px] font-semibold leading-8"
            >
              {t('subscription.earlyBirdsWelcome.title')}
            </div>
            <div
              className="
                  [font-family:'PingFang_SC'] text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-white text-[22px] font-semibold leading-8"
            >
              {t('subscription.earlyBirdsWelcome.subtitle')}
            </div>

            {/* Description text */}
            <div
              className=" mt-[8px]
                 [font-family:'PingFang_SC'] self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-gray-200 text-sm font-normal leading-5"
            >
              {t('subscription.earlyBirdsWelcome.description1')}
            </div>
            <div
              className="
                 [font-family:'PingFang_SC'] self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-gray-200 text-sm font-normal leading-5 mt-2"
            >
              {t('subscription.earlyBirdsWelcome.description2')}
            </div>
            <div
              className="
                 [font-family:'PingFang_SC'] self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-gray-200 text-sm font-normal leading-5 mt-2"
            >
              {t('subscription.earlyBirdsWelcome.description3')}
            </div>

            {/* Divider */}
            <div
              className="w-full h-[1px] my-4 border-t border-dashed border-black/10 dark:border-white/10
                  flex flex-col items-start gap-4 self-stretch border-b-0
                  "
            />

            <div
              className={`
self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-white [font-family:新叶念体] text-4xl font-normal ${i18n.language === 'en' || i18n.language.startsWith('en-') ? 'leading-[40px]' : 'leading-[56px]'} tracking-[-2px]                  
`}
            >
              {t('subscription.earlyBirdsWelcome.slogan')}
            </div>

            {/* Button area */}
            <div className="flex justify-center gap-4 w-full mt-[40px]">
              <Button
                onClick={handleClose}
                className="
                      flex h-[var(--height-button\_default,32px)] [padding:var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingRight,12px)_var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingLeft,12px)] justify-center items-center flex-[1_0_0] border-[color:var(--border---refly-Control-Border,rgba(0,0,0,0.14))] dark:border-gray-600 [background:var(--bg-control---refly-bg-control-z0,#F6F6F6)] dark:bg-gray-700 dark:text-white rounded-lg border-[0.5px] border-solid
                      "
              >
                {t('subscription.earlyBirdsWelcome.gotIt')}
              </Button>
              <Button
                type="primary"
                onClick={handleLearnMore}
                className="
                      flex h-[var(--height-button\_default,32px)] [padding:var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingRight,12px)_var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingLeft,12px)] justify-center items-center flex-[1_0_0] [background:var(--primary---refly-primary-default,#0E9F77)] dark:bg-[#0E9F77] dark:text-white rounded-lg
                      "
              >
                {t('subscription.earlyBirdsWelcome.learnMore')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start w-full p-0 dark:bg-transparent bg-transparent">
            {/* Logo container */}
            <div className="w-full flex justify-start mb-4">
              <Logo />
            </div>

            {/* Title section */}
            <div
              className="mt-[16px]
        [font-family:'PingFang_SC'] text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-white text-[22px] font-semibold leading-8"
            >
              {t('subscription.subscriptionManagement.creditsWelcome.title')}
            </div>
            <div
              className="
        [font-family:'PingFang_SC'] text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-white text-[22px] font-semibold leading-8"
            >
              {t('subscription.subscriptionManagement.creditsWelcome.subtitle')}
            </div>

            {/* Description text */}
            <div
              className=" mt-[8px]
       [font-family:'PingFang_SC'] self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-gray-200 text-sm font-normal leading-5"
            >
              {t('subscription.subscriptionManagement.creditsWelcome.description1')}
            </div>
            <div
              className="
       [font-family:'PingFang_SC'] self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-gray-200 text-sm font-normal leading-5"
            >
              {t('subscription.subscriptionManagement.creditsWelcome.description2')}
            </div>

            {/* Divider */}
            <div
              className="w-full h-[1px] my-4 border-t border-dashed border-black/10 dark:border-white/10
        flex flex-col items-start gap-4 self-stretch border-b-0
        "
            />

            <div
              className={`
self-stretch text-[color:var(--text-icon-refly-text-0,#1C1F23)] dark:text-white [font-family:新叶念体] text-4xl font-normal ${i18n.language === 'en' || i18n.language.startsWith('en-') ? 'leading-[40px]' : 'leading-[56px]'} tracking-[-2px]                  
`}
            >
              {t('subscription.subscriptionManagement.creditsWelcome.slogan')}
            </div>

            {/* Button area */}
            <div className="flex justify-center gap-4 w-full mt-[40px]">
              <Button
                onClick={handleClose}
                className="
            flex h-[var(--height-button\_default,32px)] [padding:var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingRight,12px)_var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingLeft,12px)] justify-center items-center flex-[1_0_0] border-[color:var(--border---refly-Control-Border,rgba(0,0,0,0.14))] dark:border-gray-600 [background:var(--bg-control---refly-bg-control-z0,#F6F6F6)] dark:bg-gray-700 dark:text-white rounded-lg border-[0.5px] border-solid
            "
              >
                {t('subscription.subscriptionManagement.creditsWelcome.continueButton')}
              </Button>
              <Button
                type="primary"
                onClick={handleLearnMore}
                className="
            flex h-[var(--height-button\_default,32px)] [padding:var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingRight,12px)_var(--spacing-button\_default-paddingTop,6px)_var(--spacing-button\_default-paddingLeft,12px)] justify-center items-center flex-[1_0_0] [background:var(--primary---refly-primary-default,#0E9F77)] dark:bg-[#0E9F77] dark:text-white rounded-lg
            "
              >
                {t('subscription.subscriptionManagement.creditsWelcome.learnMoreButton')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
