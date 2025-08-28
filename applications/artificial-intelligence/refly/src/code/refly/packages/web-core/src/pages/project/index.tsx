import { Project } from '@refly-packages/ai-workspace-common/components/project';
import { useParams } from 'react-router-dom';
import { useSiderStoreShallow } from '@refly/stores';
import cn from 'classnames';

const ProjectPage = () => {
  const { projectId = '' } = useParams();
  const { collapse } = useSiderStoreShallow((state) => ({
    collapse: state.collapse,
  }));
  return (
    <div className={cn('w-full h-full p-2', { 'pl-0': !collapse })}>
      <Project projectId={projectId} />
    </div>
  );
};

export default ProjectPage;
