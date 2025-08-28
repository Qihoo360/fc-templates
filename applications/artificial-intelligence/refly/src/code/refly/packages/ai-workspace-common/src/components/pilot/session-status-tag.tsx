import { memo, useMemo } from 'react';
import { PilotSessionStatus, PilotStep } from '@refly/openapi-schema';
import { ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { Finished, Running1 } from 'refly-icons';
import { useTranslation } from 'react-i18next';

export interface SessionStatusTagProps {
  status: PilotSessionStatus;
  steps: PilotStep[];
  className?: string;
}

export const SessionStatusTag = memo(({ status, steps, className }: SessionStatusTagProps) => {
  const { t } = useTranslation();
  const icon = useMemo(() => {
    switch (status) {
      case 'executing':
        return <Running1 className="w-4 h-4 animate-spin" />;
      case 'waiting':
        return <ClockCircleOutlined className="w-4 h-4" />;
      case 'finish':
        return <Finished className="w-4 h-4" color="var(--refly-primary-default)" />;
      case 'failed':
        return <CloseCircleOutlined className="w-4 h-4" />;
      default:
        return null;
    }
  }, [status]);
  const finishedStepsLength = useMemo(() => {
    return steps.filter((step) => step.status === 'finish').length;
  }, [steps]);
  const text = useMemo(() => {
    switch (status) {
      case 'executing':
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs p-1">{t('pilot.status.planning')}</span>
          </div>
        );
      case 'waiting':
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs p-1">
              {t('pilot.status.executingSteps', {
                current: finishedStepsLength,
                total: steps.length,
              })}
            </span>
          </div>
        );
      case 'finish':
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs p-1">
              {t('pilot.status.completedTasks', { count: steps.length })}
            </span>
          </div>
        );
      case 'failed':
        return t('pilot.status.taskFailed');
    }
  }, [status, finishedStepsLength, steps.length, t]);
  return (
    <div className={cn(className, 'flex items-center gap-0 px-3')}>
      {icon}
      {text}
      {/* <span className="text-[10px] m-0 p-0">
        {t(`pilot.status.${status}`, { defaultValue: status })}
      </span> */}
    </div>
  );
});

SessionStatusTag.displayName = 'SessionStatusTag';
