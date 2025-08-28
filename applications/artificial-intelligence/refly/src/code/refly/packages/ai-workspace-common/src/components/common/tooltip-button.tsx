import { memo } from 'react';
import { Tooltip, TooltipProps } from 'antd';

interface TooltipWrapperProps {
  tooltip?: React.ReactNode;
  children: React.ReactElement;
}

const TooltipWrapper = memo(
  ({
    tooltip,
    children,
    mouseEnterDelay = 0.5,
    mouseLeaveDelay = 0.1,
    placement = 'right',
    overlayClassName = '!px-2 !py-1',
    arrow = false,
    ...tooltipProps
  }: TooltipWrapperProps & TooltipProps) => {
    if (!tooltip) {
      return children;
    }

    return (
      <Tooltip
        title={tooltip}
        mouseEnterDelay={mouseEnterDelay}
        mouseLeaveDelay={mouseLeaveDelay}
        placement={placement}
        overlayClassName={overlayClassName}
        arrow={arrow}
        {...tooltipProps}
      >
        {children}
      </Tooltip>
    );
  },
);

TooltipWrapper.displayName = 'TooltipWrapper';

export default TooltipWrapper;
