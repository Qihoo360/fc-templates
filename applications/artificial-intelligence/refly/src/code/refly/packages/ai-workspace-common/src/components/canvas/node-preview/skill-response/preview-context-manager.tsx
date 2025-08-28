import { IContextItem } from '@refly/common-types';
import { ContextItem } from '@refly-packages/ai-workspace-common/components/canvas/launchpad/context-manager/context-item';
import { memo, useMemo } from 'react';
import './index.scss';

interface PreviewContextManagerProps {
  contextItems: IContextItem[];
}

const PreviewContextManagerComponent = (props: PreviewContextManagerProps) => {
  const { contextItems } = props;

  const renderedContextItems = useMemo(
    () =>
      contextItems?.length > 0
        ? contextItems.map((item, index) => (
            <ContextItem
              canNotRemove={true}
              key={`${item.entityId}-${index}`}
              item={item}
              isLimit={false}
              isActive={false}
            />
          ))
        : null,
    [contextItems],
  );

  return (
    <div className="py-2 flex flex-wrap content-start gap-1 w-full">{renderedContextItems}</div>
  );
};

export const PreviewContextManager = memo(
  PreviewContextManagerComponent,
  (prevProps, nextProps) => {
    return prevProps.contextItems === nextProps.contextItems;
  },
);
