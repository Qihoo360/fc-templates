import { useEffect } from 'react';
import { useQuickActionStore } from '@refly/stores';
import { usePopupStore } from '@refly/stores';
import { calcPopupPosition } from '@/utils/ui';

export const useRegisterMouseEvent = () => {
  const quickActionStore = useQuickActionStore();
  const popupStore = usePopupStore();

  const handleMouseUp = (event: MouseEvent) => {
    const { target } = event;
    const nodeName = (target as any).nodeName;

    if (nodeName === 'PLASMO-CSUI') {
      // 点击的是 Bar 上的按钮，返回
      return;
    }

    const selection = window.getSelection();
    const text = selection.toString();
    if (text) {
      const range = selection.getRangeAt(0);

      const rect = range?.getBoundingClientRect();
      const { barDimension } = quickActionStore;
      const { top, left } = calcPopupPosition(rect, {
        barWidth: barDimension.width,
        barHeight: barDimension.height,
      });

      quickActionStore.setBarPosition({ top, left });
      quickActionStore.setSelectedText(text);
      quickActionStore.setToolbarVisible(true);
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    const { target } = event;
    const nodeName = (target as any).nodeName;

    if (nodeName === 'PLASMO-CSUI') {
      // 点击的是 Bar 上的按钮，返回
      return;
    }

    const selection = window.getSelection();
    const text = selection.toString();
    // 手动清除当前选中的文本，解决了当鼠标按下区域为非文本区域时，Bar 不能及时隐藏
    if (
      text.length === 0 ||
      quickActionStore.selectedText.length === 0 ||
      text === quickActionStore.selectedText
    ) {
      window.getSelection().empty();
      quickActionStore.setSelectedText('');
      quickActionStore.setToolbarVisible(false);
      popupStore.setPopupVisible(false);
    }
  };

  const bindMouseEvent = () => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);
  };

  useEffect(() => {
    bindMouseEvent();

    return () => {
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, {
        capture: true,
      });
    };
  }, []);
};
