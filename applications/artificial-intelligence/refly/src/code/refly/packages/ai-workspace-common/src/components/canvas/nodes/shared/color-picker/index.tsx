import { FC, memo, useState } from 'react';
import { ColorPicker as AntdColorPicker, Divider, Popover } from 'antd';
import { Color } from 'antd/es/color-picker';
import { MdColorLens } from 'react-icons/md';
import './index.scss';

// Preset colors
export const presetColors = [
  '#eae7fa', // Purple
  '#e5f3ff', // Blue
  '#cff9fe', // Cyan
  '#d1f9e8', // Light Green
  '#e3fbcc', // Green
  '#fffee7', // Yellow
  '#fee1c7', // Orange
  '#ffede7', // Pink
  '#f2f4f7', // Gray
  '#ffffff', // White
];

interface CommonColorPickerProps {
  color: string;
  onChange?: (color: string) => void;
  className?: string;
  disabledAlpha?: boolean;
}

const CommonColorPicker: FC<CommonColorPickerProps> = ({
  color,
  onChange,
  className = '',
  disabledAlpha = false,
}) => {
  const [open, setOpen] = useState(false);

  const handleColorChange = (_color: Color | any, css: string) => {
    onChange?.(css);
  };

  return (
    <Popover
      overlayClassName="color-picker-popover"
      open={open}
      onOpenChange={setOpen}
      content={
        <div className="flex items-center gap-2">
          {presetColors.map((presetColor) => (
            <div
              key={presetColor}
              className="flex items-center justify-center rounded-md w-6 h-6 hover:bg-refly-tertiary-hover cursor-pointer"
            >
              <div
                className={`w-5 h-5 rounded-full border-solid border-[2px] box-border border-refly-Card-Border ${presetColor === color ? 'border-refly-primary-default' : ''}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  handleColorChange(presetColor, presetColor);
                  setOpen(false);
                }}
              />
            </div>
          ))}
          <Divider type="vertical" className="!m-0" />
          <AntdColorPicker
            arrow={false}
            size="small"
            className={`memo-color-picker items-center border-none rounded-lg hover:refly-tertiary-hover p-0 ${className}`}
            defaultValue={color}
            onChange={handleColorChange}
            showText={false}
            disabledAlpha={disabledAlpha}
            placement="bottomRight"
          >
            <div
              className={`flex items-center justify-center rounded-md w-6 h-6 hover:bg-refly-tertiary-hover ${className}`}
              onClick={() => {
                setOpen(false);
              }}
            >
              <MdColorLens size={20} className="text-refly-text-0" />
            </div>
          </AntdColorPicker>
        </div>
      }
      trigger="click"
      placement="bottomRight"
      arrow={false}
    >
      <div
        id="color-picker-trigger"
        className={`flex items-center justify-center rounded-md w-6 h-6 hover:bg-refly-tertiary-hover  ${className}`}
      >
        <div
          className="w-4 h-4 rounded-full border-solid border-[2px] box-border border-refly-Card-Border"
          style={{ backgroundColor: color }}
        />
      </div>
    </Popover>
  );
};

export default memo(CommonColorPicker);
