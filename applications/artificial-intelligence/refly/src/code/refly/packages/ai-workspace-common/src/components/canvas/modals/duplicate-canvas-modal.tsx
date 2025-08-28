import { memo, useEffect, useState } from 'react';
import { Checkbox, Form, Input, Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useNavigate } from 'react-router-dom';
import { useHandleSiderData } from '@refly-packages/ai-workspace-common/hooks/use-handle-sider-data';
import { useGetProjectCanvasId } from '@refly-packages/ai-workspace-common/hooks/use-get-project-canvasId';
import { useCanvasOperationStoreShallow } from '@refly/stores';

type FieldType = {
  title: string;
  duplicateEntities?: boolean;
};

export const DuplicateCanvasModal = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { canvasId, canvasName, modalVisible, modalType, reset } = useCanvasOperationStoreShallow(
    (state) => ({
      canvasId: state.canvasId,
      canvasName: state.canvasTitle,
      modalVisible: state.modalVisible,
      modalType: state.modalType,
      reset: state.reset,
    }),
  );
  const visible = modalVisible && modalType === 'duplicate';

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { getCanvasList } = useHandleSiderData();
  const { projectId } = useGetProjectCanvasId();

  const onSubmit = async () => {
    let values: { title: string; duplicateEntities: boolean } | undefined;
    try {
      values = await form.validateFields();
    } catch (error) {
      console.error('Error validating form fields', error);
      return;
    }

    if (loading) return;
    setLoading(true);
    const { title, duplicateEntities } = values;
    const { data } = await getClient().duplicateCanvas({
      body: {
        projectId,
        canvasId,
        title,
        duplicateEntities,
      },
    });
    setLoading(false);

    if (data?.success && data?.data?.canvasId) {
      message.success(t('canvas.action.duplicateSuccess'));
      reset();
      getCanvasList();
      const newCanvasId = data.data.canvasId;
      const url = projectId
        ? `/project/${projectId}?canvasId=${newCanvasId}`
        : `/canvas/${newCanvasId}`;
      navigate(url);
    }
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldValue('duplicateEntities', false);
      form.setFieldValue('title', canvasName);
    }
  }, [visible]);

  return (
    <Modal
      centered
      open={visible}
      onCancel={() => reset()}
      onOk={onSubmit}
      confirmLoading={loading}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      title={t('template.duplicateCanvas')}
    >
      <div className="w-full h-full overflow-y-auto mt-3">
        <Form form={form} autoComplete="off">
          <Form.Item<FieldType>
            required
            label={t('template.canvasTitle')}
            name="title"
            className="mb-3"
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder={t('template.duplicateCanvasTitlePlaceholder')} />
          </Form.Item>

          <Form.Item className="ml-2.5" name="duplicateEntities" valuePropName="checked">
            <Checkbox>
              <span className="text-sm">{t('template.duplicateCanvasEntities')}</span>
            </Checkbox>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
});

DuplicateCanvasModal.displayName = 'DuplicateCanvasModal';
