import { useEffect, useState, memo } from 'react';
import { Button, Dropdown, DropdownProps, MenuProps } from 'antd';
import {
  IconPlayOutline,
  IconRemove,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { More, Delete, Copy, Edit } from 'refly-icons';
import { useTranslation } from 'react-i18next';
import { useCanvasOperationStoreShallow } from '@refly/stores';
import './index.scss';

interface CanvasActionDropdown {
  canvasId: string;
  canvasName: string;
  btnSize?: 'small' | 'large';
  updateShowStatus?: (canvasId: string | null) => void;
  afterDelete?: () => void;
  afterRename?: (newTitle: string, canvasId: string) => void;
  handleUseCanvas?: () => void;
  handleRemoveFromProject?: () => void;
  children?: React.ReactNode;
  offset?: [number, number];
}

export const CanvasActionDropdown = memo((props: CanvasActionDropdown) => {
  const {
    canvasId,
    canvasName,
    btnSize = 'small',
    updateShowStatus,
    handleUseCanvas,
    handleRemoveFromProject,
    children,
    offset,
  } = props;
  const [popupVisible, setPopupVisible] = useState(false);
  const { t } = useTranslation();

  const { openRenameModal, openDeleteModal, openDuplicateModal } = useCanvasOperationStoreShallow(
    (state) => ({
      openRenameModal: state.openRenameModal,
      openDeleteModal: state.openDeleteModal,
      openDuplicateModal: state.openDuplicateModal,
    }),
  );

  const items: MenuProps['items'] = [
    handleUseCanvas && {
      label: (
        <div
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            setPopupVisible(false);
            handleUseCanvas();
          }}
        >
          <IconPlayOutline size={18} />
          {t('workspace.canvasListModal.continue')}
        </div>
      ),
      key: 'useCanvas',
    },
    {
      label: (
        <div
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            openRenameModal(canvasId, canvasName);
            setPopupVisible(false);
          }}
        >
          <Edit size={18} />
          {t('canvas.toolbar.rename')}
        </div>
      ),
      key: 'rename',
    },
    {
      label: (
        <div
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            openDuplicateModal(canvasId, canvasName);
            setPopupVisible(false);
          }}
        >
          <Copy size={18} />
          {t('canvas.toolbar.duplicate')}
        </div>
      ),
      key: 'duplicate',
    },
    handleRemoveFromProject && {
      label: (
        <div
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            setPopupVisible(false);
            handleRemoveFromProject();
          }}
        >
          <IconRemove size={16} />
          {t('canvas.toolbar.removeFromProject')}
        </div>
      ),
      key: 'removeFromProject',
    },
    {
      label: (
        <div
          className="flex items-center text-refly-func-danger-default gap-1"
          onClick={(e) => {
            e.stopPropagation();
            openDeleteModal(canvasId, canvasName);
            setPopupVisible(false);
          }}
        >
          <Delete size={18} />
          {t('canvas.toolbar.deleteCanvas')}
        </div>
      ),
      key: 'delete',
    },
  ];

  const handleOpenChange: DropdownProps['onOpenChange'] = (open: boolean, info: any) => {
    if (info.source === 'trigger') {
      setPopupVisible(open);
    }
  };

  useEffect(() => {
    if (popupVisible) {
      updateShowStatus?.(canvasId);
    } else {
      updateShowStatus?.(null);
    }
  }, [popupVisible]);

  return (
    <Dropdown
      overlayClassName="canvas-action-dropdown"
      trigger={['click']}
      open={popupVisible}
      onOpenChange={handleOpenChange}
      menu={{
        items,
        ...(offset && {
          style: {
            top: offset[1],
            left: offset[0],
          },
        }),
      }}
    >
      {children ? (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      ) : (
        <Button
          size={btnSize}
          onClick={(e) => e.stopPropagation()}
          type="text"
          icon={<More size={16} />}
        />
      )}
    </Dropdown>
  );
});

CanvasActionDropdown.displayName = 'CanvasActionDropdown';
