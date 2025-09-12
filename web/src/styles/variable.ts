export enum ThemeVar {
  FrontendColor = '--frontend-color',
  BackendColor = '--backend-color',

  ConfigPanelBgColor = '--config-panel-background-color',
  FooterColor = '--footer-color',
  SpeedTestBg = '--speed-test-bg',
  SpeedTestItemBg = '--speed-test-item-bg',
  SpeedTestBorder = '--speed-test-border',
  DeleteButtonColor = '--delete-button-color',
  DeleteButtonHoverBg = '--delete-button-hover-bg',
  DeleteButtonActiveBg = '--delete-button-active-bg',
  ConfirmButtonBg = '--confirm-button-bg',
  ConfirmButtonHoverBg = '--confirm-button-hover-bg',
  CancelButtonBorder = '--cancel-button-border',
  CancelButtonHoverBorder = '--cancel-button-hover-border',
  CancelButtonHoverColor = '--cancel-button-hover-color',
  CancelButtonHoverBg = '--cancel-button-hover-bg',
  SpeedTestShadow = '--speed-test-shadow',
  SpeedTestItemShadow = '--speed-test-item-shadow',
  SpeedTestItemHoverShadow = '--speed-test-item-hover-shadow',
  ButtonTextColor = '--button-text-color',
}

export function Var(varName: string, defaultValue?: any) {
  return `var(${varName}${defaultValue ? `, ${defaultValue}` : ''})`
}
