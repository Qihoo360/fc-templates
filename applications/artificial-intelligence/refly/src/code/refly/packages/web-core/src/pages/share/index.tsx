import { useParams } from 'react-router-dom';
import { Canvas } from '@refly-packages/ai-workspace-common/components/canvas';
import { useSiderStoreShallow } from '@refly/stores';
import cn from 'classnames';

const ShareCanvasPage = () => {
  const { canvasId = '' } = useParams();
  const { collapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
  }));

  return (
    <div className={cn('w-full h-full p-2', { 'p-0': collapse })}>
      <Canvas canvasId={canvasId} readonly />
    </div>
  );
};

export default ShareCanvasPage;
