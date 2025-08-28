import { Button, Modal, Input, Form } from 'antd';

import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useAuthStoreShallow } from '@refly/stores';
import { useState } from 'react';

interface FormValues {
  email: string;
  password: string;
}

export const ResetPasswordModal = (props: {
  visible?: boolean;
  from?: string;
}) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const authStore = useAuthStoreShallow((state) => ({
    resetPasswordModalOpen: state.resetPasswordModalOpen,
    setVerificationModalOpen: state.setVerificationModalOpen,
    setResetPasswordModalOpen: state.setResetPasswordModalOpen,
    setSessionId: state.setSessionId,
    setEmail: state.setEmail,
  }));

  const { t } = useTranslation();

  const handleResetPassword = async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Error validating form fields', error);
      return;
    }

    setLoading(true);
    try {
      const { data } = await getClient().createVerification({
        body: {
          email: values.email,
          purpose: 'resetPassword',
          password: values.password,
        },
      });

      if (data?.success) {
        authStore.setResetPasswordModalOpen(false);
        authStore.setVerificationModalOpen(true);
        authStore.setEmail(values.email);
        authStore.setSessionId(data.data?.sessionId ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={props.visible || authStore.resetPasswordModalOpen}
      centered
      footer={null}
      width={410}
      onCancel={() => authStore.setResetPasswordModalOpen(false)}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="flex flex-row items-center">
          <span
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              display: 'inline-block',
              marginLeft: 8,
            }}
          >
            {t('landingPage.resetPasswordModal.title')}
          </span>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="mt-2 w-full max-w-sm px-4"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label={
              <span className="font-medium">{t('landingPage.resetPasswordModal.emailLabel')}</span>
            }
            validateTrigger={['onBlur']}
            hasFeedback
            rules={[
              {
                required: true,
                message: t('verifyRules.emailRequired'),
              },
              {
                type: 'email',
                message: t('verifyRules.emailInvalid'),
              },
            ]}
          >
            <Input
              type="email"
              placeholder={t('landingPage.resetPasswordModal.emailPlaceholder')}
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span className="font-medium">
                {t('landingPage.resetPasswordModal.passwordLabel')}
              </span>
            }
            validateTrigger={['onBlur']}
            hasFeedback
            rules={[
              {
                required: true,
                message: t('verifyRules.passwordRequired'),
              },
              {
                min: 8,
                message: t('verifyRules.passwordMin'),
              },
            ]}
          >
            <Input.Password
              placeholder={t('landingPage.resetPasswordModal.passwordPlaceholder')}
              className="h-8"
            />
          </Form.Item>

          <Form.Item
            name="passwordConfirm"
            label={
              <span className="font-medium">
                {t('landingPage.resetPasswordModal.passwordConfirmLabel')}
              </span>
            }
            validateTrigger={['onBlur']}
            hasFeedback
            rules={[
              {
                required: true,
                message: t('verifyRules.passwordRequired'),
              },
              {
                validator: (_, value) => {
                  if (value !== form.getFieldValue('password')) {
                    return Promise.reject(t('verifyRules.passwordConfirmNotMatch'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              placeholder={t('landingPage.resetPasswordModal.passwordConfirmPlaceholder')}
              className="h-8"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              loading={loading}
              onClick={handleResetPassword}
              className="h-10 w-full text-base"
            >
              {t('landingPage.resetPasswordModal.continue')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
