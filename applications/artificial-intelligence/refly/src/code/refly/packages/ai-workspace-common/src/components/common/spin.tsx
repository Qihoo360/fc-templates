import { Spin as AntdSpin, SpinProps } from 'antd';
import { IconLoading } from './icon';

export const Spin = (props: SpinProps, className?: string) => {
  return (
    <AntdSpin indicator={<IconLoading className={`animate-spin ${className}`} />} {...props} />
  );
};
