export type PlatformCapabilities = {
  isIos: boolean
  canRequestFullscreen: boolean
  showMiuiInstallHint: boolean
}

export function getPlatformCapabilities(): PlatformCapabilities {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIos: false,
      canRequestFullscreen: false,
      showMiuiInstallHint: false,
    }
  }

  const userAgent = navigator.userAgent
  const platform = navigator.platform
  const isIpadOsDesktopMode =
    platform === 'MacIntel' && navigator.maxTouchPoints > 1
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || isIpadOsDesktopMode
  const fullscreenElement = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
  }

  return {
    isIos,
    canRequestFullscreen: Boolean(
      fullscreenElement.requestFullscreen ?? fullscreenElement.webkitRequestFullscreen,
    ),
    showMiuiInstallHint: !isIos,
  }
}
