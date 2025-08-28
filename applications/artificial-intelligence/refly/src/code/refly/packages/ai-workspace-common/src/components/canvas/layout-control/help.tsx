import { Button, Dropdown, Space, Tooltip } from 'antd';
import { LuShipWheel } from 'react-icons/lu';
import { useUserStoreShallow } from '@refly/stores';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconDocumentation } from '@refly-packages/ai-workspace-common/components/common/icon';
import { Question } from 'refly-icons';
const iconClass = 'flex items-center justify-center text-base';
export const Help = () => {
  const { t } = useTranslation();
  const { setShowSettingsGuideModal } = useUserStoreShallow((state) => ({
    setShowSettingsGuideModal: state.setShowSettingsGuideModal,
  }));
  const helpMenuItems = useMemo(
    () => [
      {
        key: 'settings',
        icon: <LuShipWheel className={iconClass} size={16} />,
        label: <Space>{t('canvas.toolbar.openSettings')}</Space>,
        onClick: () => setShowSettingsGuideModal(true),
      },
      {
        key: 'docs',
        icon: <IconDocumentation className={iconClass} size={16} />,
        label: <Space>{t('canvas.toolbar.openDocs')}</Space>,
        onClick: () => window.open('https://docs.refly.ai', '_blank'),
      },
    ],
    [t, setShowSettingsGuideModal],
  );
  return (
    <div>
      <Dropdown menu={{ items: helpMenuItems }} trigger={['click']}>
        <Tooltip title={t('canvas.toolbar.tooltip.help')} arrow={false}>
          <Button
            type="text"
            className="h-[32px] w-[32px] flex items-center justify-center"
            icon={<Question size={18} />}
          />
        </Tooltip>
      </Dropdown>
    </div>
  );
};
