import { memo } from 'react';
import { Progress, Tooltip } from 'antd';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi';

interface UsageProgressProps {
  label: string;
  tooltip: string;
  used: number;
  quota: number;
}

const formatNumber = (num: number) => {
  if (num < 0) {
    return '∞';
  }
  return num?.toLocaleString() || '0';
};

export const UsageProgress = memo<UsageProgressProps>(({ label, tooltip, used, quota }) => {
  const percent = (used * 100) / (quota || 1);

  return (
    <>
      <div className="-mb-2.5 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Tooltip className="flex flex-row items-center gap-1 cursor-pointer" title={tooltip}>
            <span>{label}</span>
            <HiOutlineQuestionMarkCircle className="text-sm flex items-center justify-center cursor-pointer" />
          </Tooltip>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="text-gray-700 dark:text-gray-200">
            {formatNumber(used)}/{formatNumber(quota)}
          </span>
        </div>
      </div>
      <Progress
        strokeColor={used >= quota ? '#dc2626' : '#0E9F77'}
        percent={percent}
        size={{ height: 4 }}
        showInfo={false}
      />
    </>
  );
});

UsageProgress.displayName = 'UsageProgress';
