import { useLayoutEffect, useState } from 'react';

interface ResizePanelProps {
  getGroupSelector: () => HTMLElement;
  getResizeSelector: () => NodeListOf<HTMLElement>;
  initialMinSize: number;
  initialMinPixelSize: number;
}

export const useResizePanel = (props: ResizePanelProps) => {
  const { getGroupSelector, getResizeSelector, initialMinPixelSize, initialMinSize } = props;
  const [minSize, setMinSize] = useState(initialMinSize);

  useLayoutEffect(() => {
    const panelGroup = getGroupSelector();
    const resizeHandles = getResizeSelector();
    if (!(panelGroup instanceof Element)) return;

    const observer = new ResizeObserver(() => {
      let width = panelGroup.offsetWidth;

      for (const resizeHandle of resizeHandles) {
        width -= resizeHandle.offsetWidth;
      }

      // console.log('initialMinPixelSize', width);

      setMinSize((initialMinPixelSize / width) * 100);
    });
    observer.observe(panelGroup);
    for (const resizeHandle of resizeHandles) {
      if (!(resizeHandle instanceof Element)) return;
      observer.observe(resizeHandle);
    }

    return () => {
      observer.unobserve(panelGroup);
      for (const resizeHandle of resizeHandles) {
        observer.unobserve(resizeHandle);
      }
      observer.disconnect();
    };
  }, []);

  return [minSize];
};
