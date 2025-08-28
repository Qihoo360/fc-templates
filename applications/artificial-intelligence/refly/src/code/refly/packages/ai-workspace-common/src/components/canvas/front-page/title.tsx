import { useTranslation } from 'react-i18next';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { Logo } from '@refly-packages/ai-workspace-common/components/common/logo';
import { canvasTemplateEnabled } from '@refly/ui-kit';

export const Title = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh-CN';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center mb-6',
        canvasTemplateEnabled ? 'mt-48' : '',
      )}
    >
      <div className="flex flex-col max-w-full w-[800px] text-refly-text-0">
        <div className="flex gap-2 justify-center items-center self-center">
          {isZh ? (
            <div className="flex gap-2 items-center  text-3xl font-semibold leading-10 text-center">
              <div className="self-stretch my-auto">和</div>
              <Logo logoProps={{ show: false }} textProps={{ show: true, className: 'w-[70px]' }} />
              <div className="self-stretch my-auto">一起探索</div>
              <div className="self-stretch my-auto text-refly-primary-default">好奇心</div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 items-center my-auto text-3xl font-semibold leading-none text-center whitespace-nowrap">
                <span className="self-stretch my-auto">Explore</span>
                <span className="self-stretch my-auto text-refly-primary-default">Curiosity</span>
                <span className="self-stretch my-auto">With</span>
                <Logo
                  logoProps={{ show: false }}
                  textProps={{ show: true, className: 'w-[70px]' }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
