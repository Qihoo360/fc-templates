import { type ReactElement, type ReactNode } from 'react';
import { LeftOutlined } from '@ant-design/icons';
import { Button, Skeleton, Typography } from 'antd';

import {
  LayoutContainer,
  LayoutContainerContextUpdater,
  type LayoutContainerRenderLayoutProps,
  type LayoutContainerSlotProps,
  type LayoutContainerSlotType,
  useLayoutContainerSlotProps,
} from './components/LayoutContainer';

const { Text } = Typography;

export interface SecondaryPageLayoutContext {
  title?: ReactNode;
  desc?: ReactNode;
  extra?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
}

export type SecondaryPageLayoutSlotProps = LayoutContainerSlotProps<SecondaryPageLayoutContext>;

export type SecondaryPageLayoutSlotType = LayoutContainerSlotType<SecondaryPageLayoutContext>;

function RenderLayout({
  renderSlot,
  context,
}: LayoutContainerRenderLayoutProps<SecondaryPageLayoutContext>) {
  const isLoading = !context.title;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex-shrink-0 flex flex-col px-4 py-3 border-0 border-b border-solid border-line-border-card">
        <div className="flex items-center gap-2 h-8">
          <div className="flex items-center flex-1 min-w-0 gap-1">
            <Button
              type="text"
              className="text-text-title font-medium"
              icon={<LeftOutlined />}
              onClick={context.onBack}
            >
              Back
            </Button>
            <Text className="text-icon-n3">/</Text>
            <Skeleton loading={isLoading}>
              <Text className="ml-1">{context.title}</Text>
              <div className="flex-1 min-w-0">{context.extra}</div>
            </Skeleton>
          </div>
          <div className="flex items-center">{context.actions}</div>
        </div>
        {context.desc && <div className="min-h-5">{context.desc}</div>}
      </div>
      <div className="w-full h-0 flex-grow overflow-auto">{renderSlot('Content')}</div>
    </div>
  );
}

export interface SecondaryPageLayoutProps {
  children?: SecondaryPageLayoutSlotType;
}

export function SecondaryPageLayout({ children }: SecondaryPageLayoutProps): ReactElement {
  const navigateBack = () => {
    // loop
  };

  return (
    <LayoutContainer<SecondaryPageLayoutContext>
      slots={{
        Content: children,
      }}
      initialContextValue={{
        onBack: navigateBack,
      }}
      RenderLayout={RenderLayout}
    />
  );
}

export function useSecondaryPageLayoutSlotProps(): SecondaryPageLayoutSlotProps | null {
  return useLayoutContainerSlotProps(RenderLayout);
}

export interface SecondaryPageLayoutContextUpdaterProps extends SecondaryPageLayoutContext {
  deps: unknown[];
}

export function SecondaryPageLayoutContextUpdater({
  deps,
  ...context
}: SecondaryPageLayoutContextUpdaterProps): ReactElement {
  return <LayoutContainerContextUpdater {...context} RenderLayout={RenderLayout} deps={deps} />;
}
