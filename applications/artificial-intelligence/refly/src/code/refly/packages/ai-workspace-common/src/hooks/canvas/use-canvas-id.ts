import { useParams } from 'react-router-dom';
import { useCanvasContext } from '../../context/canvas';

export const useCanvasId = () => {
  const { canvasId: contextCanvasId } = useCanvasContext();
  const { canvasId: routeCanvasId } = useParams();
  const canvasId = contextCanvasId ?? routeCanvasId;

  return canvasId;
};
