import { Tooltip } from '@arco-design/web-react';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

type IconTipPosition =
  | 'top'
  | 'br'
  | 'rt'
  | 'tr'
  | 'tl'
  | 'bottom'
  | 'bl'
  | 'left'
  | 'lt'
  | 'lb'
  | 'right'
  | 'rb';

export const IconTip = ({
  text,
  children,
  position = 'top',
}: {
  text: string;
  children: any;
  position?: IconTipPosition;
}) => (
  <Tooltip mini position={position} content={text} getPopupContainer={getPopupContainer}>
    {children}
  </Tooltip>
);
