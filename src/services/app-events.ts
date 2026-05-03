import {
  getFullscreenElement,
  updateViewportHeight,
  type BeforeInstallPromptEvent,
} from './browser'

export function setupAppBrowserEvents(handlers: {
  onInstallPrompt: (event: BeforeInstallPromptEvent) => void
  onInstalled: () => void
  onFullscreenChange: (isFullscreen: boolean) => void
}) {
  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    handlers.onInstallPrompt(event as BeforeInstallPromptEvent)
  }
  const handleAppInstalled = () => handlers.onInstalled()
  const handleFullscreenChange = () => {
    handlers.onFullscreenChange(Boolean(getFullscreenElement()))
    updateViewportHeight()
  }

  updateViewportHeight()
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  window.addEventListener('resize', updateViewportHeight)
  window.visualViewport?.addEventListener('resize', updateViewportHeight)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
    window.removeEventListener('resize', updateViewportHeight)
    window.visualViewport?.removeEventListener('resize', updateViewportHeight)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  }
}
