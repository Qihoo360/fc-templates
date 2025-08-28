export interface SidePanelAction {
  name: 'openContentSelector';
  value: boolean;
}

export interface ToggleCopilotStatus {
  openContentSelector: boolean;
}
