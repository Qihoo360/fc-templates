import { memo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from 'antd';
import { SkillResponseNodePreview } from '@refly-packages/ai-workspace-common/components/canvas/node-preview/skill-response';
import { LinearThreadMessage } from '@refly/stores';
import { useUserStoreShallow } from '@refly/stores';
import { AiOutlineUser } from 'react-icons/ai';

interface LinearThreadContentProps {
  messages: LinearThreadMessage[];
  contentHeight: string | number;
  className?: string;
  source?: 'skillResponse' | 'thread';
}

// Optimize SkillResponseNodePreview with memo
const MemoizedSkillResponseNodePreview = memo(SkillResponseNodePreview, (prevProps, nextProps) => {
  return (
    prevProps.resultId === nextProps.resultId &&
    prevProps.node.data?.entityId === nextProps.node.data?.entityId
  );
});

MemoizedSkillResponseNodePreview.displayName = 'MemoizedSkillResponseNodePreview';

export const EmptyThreadWelcome = memo(() => {
  const { t } = useTranslation();
  const { userProfile } = useUserStoreShallow((state) => ({
    userProfile: state.userProfile,
  }));

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-gray-700 dark:text-gray-200">
      <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary-300 to-primary-600 opacity-75 blur-sm" />
            <Avatar
              size={64}
              src={userProfile?.avatar}
              className="relative border-2 border-white shadow-refly-m"
              icon={<AiOutlineUser />}
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-center text-gray-800 mb-1 dark:text-gray-100">
          {t('canvas.reflyPilot.welcome.title', { name: userProfile?.nickname || '' })}
        </h3>

        <p className="text-base text-center text-gray-600 mb-6">
          {t('canvas.reflyPilot.welcome.subtitle')}
        </p>
      </div>
    </div>
  );
});

EmptyThreadWelcome.displayName = 'EmptyThreadWelcome';

export const LinearThreadContent = memo(
  ({ messages, className = '' }: LinearThreadContentProps) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

    // Filter messages based on source
    const displayMessages = messages.length > 0 ? [messages[messages.length - 1]] : [];

    // Scroll to the start of the last message
    useEffect(() => {
      if (messagesContainerRef.current && displayMessages.length > 0) {
        setTimeout(() => {
          const lastMessageElement = document.getElementById(
            `message-wrapper-${displayMessages[displayMessages.length - 1].id}-${displayMessages.length - 1}`,
          );

          if (lastMessageElement && messagesContainerRef.current) {
            // If it's the only message, scroll to top
            if (displayMessages.length === 1) {
              messagesContainerRef.current.scrollTop = 0;
            } else {
              // Scroll to position the last message at the top
              const scrollTop = lastMessageElement.offsetTop - 16; // Add some padding

              messagesContainerRef.current.scrollTop = scrollTop;
            }
          }
        }, 100);
      }
    }, [displayMessages]);

    return (
      <div
        ref={messagesContainerRef}
        className={`flex-grow overflow-auto message-container ${className}`}
      >
        {displayMessages.length === 0 ? (
          <EmptyThreadWelcome key={'empty-thread-welcome'} />
        ) : (
          <div className="h-full max-w-[1024px] mx-auto">
            {displayMessages.map((message, index) => (
              <div
                className="h-full"
                key={`message-wrapper-${message.id}-${index}`}
                id={`message-wrapper-${message.id}-${index}`}
                ref={index === displayMessages.length - 1 ? lastMessageRef : null}
              >
                <div key={`message-content-${message.id}`} className="h-full">
                  <MemoizedSkillResponseNodePreview
                    node={{
                      id: message.nodeId,
                      type: 'skillResponse',
                      position: { x: 0, y: 0 },
                      data: message.data,
                    }}
                    resultId={message.resultId}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

LinearThreadContent.displayName = 'LinearThreadContent';
