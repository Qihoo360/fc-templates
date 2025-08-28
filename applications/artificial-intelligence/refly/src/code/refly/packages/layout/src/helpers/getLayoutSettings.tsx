export interface LayoutSettings {
  hideHeaderActions: boolean;
  hidePreviewPanel: boolean;
}

const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  hideHeaderActions: false,
  hidePreviewPanel: false,
};

const LAYOUT_SETTINGS_BY_CONDITION: {
  when: () => boolean;
  setting: Partial<LayoutSettings>;
}[] = [
  {
    when: () => /^\/pricing/.test(window.location.pathname),
    setting: {
      hideHeaderActions: true,
    },
  },
];

export function getLayoutSettings(): LayoutSettings {
  const finalSettings = { ...DEFAULT_LAYOUT_SETTINGS };
  for (const { when, setting } of LAYOUT_SETTINGS_BY_CONDITION) {
    if (when()) {
      Object.assign(finalSettings, setting);
    }
  }
  return finalSettings;
}
