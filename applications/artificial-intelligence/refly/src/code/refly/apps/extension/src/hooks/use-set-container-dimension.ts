import { useEffect } from 'react';
// stores
import { useCopilotStore } from '@refly/stores';

export const useSetContainerDimension = () => {
  const copilotStore = useCopilotStore();

  useEffect(() => {
    // Sidebar 唤起后更改 html 宽度，达到挤压的效果
    const html = document.querySelector('html') as HTMLElement;
    html.style.position = 'relative';
    html.style.minHeight = '100vh';
    if (copilotStore.isCopilotOpen) {
      const { clientWidth = 0 } =
        document.querySelector('refly-main-app')?.shadowRoot?.querySelector('.main') || {};
      html.style.width = `calc(100vw - ${clientWidth}px)`;
    } else {
      html.style.width = '100vw';
    }
  }, [copilotStore.isCopilotOpen]);
};
