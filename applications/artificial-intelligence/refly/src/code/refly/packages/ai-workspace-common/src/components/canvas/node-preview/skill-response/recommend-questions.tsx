import { useChatStore } from '@refly/stores';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { memo, useCallback } from 'react';

interface RecommendQuestionsProps {
  relatedQuestions: string[];
}

const RecommendQuestionsComponent = ({ relatedQuestions }: RecommendQuestionsProps) => {
  const { t } = useTranslation();
  const chatStore = useChatStore();

  const handleQuestionClick = useCallback(
    (question: string) => {
      chatStore.setNewQAText(question);
      message.success(t('copilot.message.askFollowingSuccess'));
    },
    [chatStore, t],
  );

  if (!relatedQuestions?.length) return null;

  return (
    <div className="mt-4">
      <div>
        <p className="text-xs font-medium text-black/50 mb-1">
          {t('copilot.message.relatedQuestion')}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {relatedQuestions.map((item) => (
          <div
            key={item}
            className="flex flex-row items-center justify-between rounded-lg transition-colors duration-200 hover:cursor-pointer group"
            onClick={() => handleQuestionClick(item)}
          >
            <p className="text-xs text-teal-600 group-hover:text-teal-600 transition-colors duration-200">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecommendQuestions = memo(RecommendQuestionsComponent, (prevProps, nextProps) => {
  return (
    prevProps.relatedQuestions === nextProps.relatedQuestions ||
    (prevProps.relatedQuestions?.length === nextProps.relatedQuestions?.length &&
      prevProps.relatedQuestions?.every((q, i) => q === nextProps.relatedQuestions[i]))
  );
});
