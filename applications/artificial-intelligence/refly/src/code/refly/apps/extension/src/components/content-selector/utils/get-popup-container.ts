import { getRuntime } from '@refly/utils/env';
import { getWebPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';

export const getExtensionPopupContainer = () => {
  const elem = document.querySelector('refly-content-selector')?.shadowRoot?.querySelector('.main');

  return elem as HTMLElement;
};

export const getPopupContainer = () => {
  return ['web', 'extension-sidepanel'].includes(getRuntime())
    ? getWebPopupContainer()
    : getExtensionPopupContainer();
};
