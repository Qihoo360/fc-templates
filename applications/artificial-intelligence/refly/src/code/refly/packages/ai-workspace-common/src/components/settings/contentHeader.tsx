import { useSiderStoreShallow } from '@refly/stores';
import { Button, Divider } from 'antd';
import { Close } from 'refly-icons';
interface ContentHeaderProps {
  prefixIcon?: React.ReactNode;
  title: string;
  onTitleClick?: () => void;
  customActions?: React.ReactNode;
  closable?: boolean;
}
export const ContentHeader = ({
  prefixIcon,
  title,
  onTitleClick,
  customActions,
  closable = true,
}: ContentHeaderProps) => {
  const { setShowSettingModal } = useSiderStoreShallow((state) => ({
    setShowSettingModal: state.setShowSettingModal,
  }));

  const handleClose = () => {
    setShowSettingModal(false);
  };

  return (
    <div className="p-4 flex items-center justify-between border-solid border-[1px] border-x-0 border-t-0 border-refly-Card-Border">
      <Button
        type="text"
        className={`flex items-center gap-2 ${onTitleClick ? 'cursor-pointer' : 'p-0 pointer-events-none'}`}
        onClick={onTitleClick}
        icon={prefixIcon}
      >
        <div className="text-lg font-semibold text-refly-text-0 leading-7">{title}</div>
      </Button>
      <div className="flex items-center gap-3">
        {customActions}
        {closable && (
          <>
            {customActions && <Divider type="vertical" className="mx-1 h-6 bg-refly-Card-Border" />}
            <Button type="text" icon={<Close size={24} />} onClick={handleClose} />
          </>
        )}
      </div>
    </div>
  );
};
