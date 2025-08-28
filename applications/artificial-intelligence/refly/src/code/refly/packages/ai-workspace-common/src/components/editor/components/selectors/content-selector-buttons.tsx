import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { IconQuote } from '@refly-packages/ai-workspace-common/components/common/icon';

interface ContentSelectorButtonsProps {
  text: string;
  handleClick: () => void;
}

export const ContentSelectorButtons: React.FC<ContentSelectorButtonsProps> = (props) => {
  const { handleClick } = props;
  const { t } = useTranslation();

  return (
    <Tooltip title={t('knowledgeBase.canvas.editor.toolbar.quote')}>
      <Button type="text" className="rounded-none px-2 " onClick={handleClick}>
        <IconQuote className="w-3 h-3 text-[#0E9F77]" size={16} />
      </Button>
    </Tooltip>
  );
};
