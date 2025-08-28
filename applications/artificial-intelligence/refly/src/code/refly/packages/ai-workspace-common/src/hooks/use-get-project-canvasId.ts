import { useParams, useMatch, useSearchParams } from 'react-router-dom';

export const useGetProjectCanvasId = () => {
  const [searchParams] = useSearchParams();
  const matchProject = useMatch('/project/:projectId');
  const matchCanvas = useMatch('/canvas/:canvasId');
  const params = useParams();

  const projectId = matchProject ? params?.projectId || matchProject?.params?.projectId : undefined;
  const canvasId = matchCanvas
    ? params?.canvasId || matchCanvas?.params?.canvasId
    : searchParams.get('canvasId');

  const isCanvasOpen = canvasId && canvasId !== 'empty';

  return { projectId, canvasId, isCanvasOpen };
};
