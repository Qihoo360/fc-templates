import { SiderPopover } from '@refly-packages/ai-workspace-common/components/sider/popover';
import { useSiderStoreShallow } from '@refly/stores';
import { FrontPage } from '@refly-packages/ai-workspace-common/components/canvas/front-page';

export const NoCanvas = ({ projectId }: { projectId: string }) => {
  const { collapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
  }));
  return (
    <div className="flex h-full w-full flex-col">
      {collapse && (
        <SiderPopover align={{ offset: [8, -48] }} childrenClassName="absolute top-6 left-6 z-10" />
      )}
      <FrontPage projectId={projectId} />
    </div>
  );
};
