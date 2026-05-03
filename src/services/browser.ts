import type { ThemeMode } from './types'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
}

export function updateDocumentTheme(currentTheme: ThemeMode) {
  if (typeof document === 'undefined') return

  document.documentElement.style.setProperty(
    '--app-bg',
    currentTheme === 'dark' ? '#050505' : '#f7f7f2',
  )
}

export function updateViewportHeight() {
  const fullscreenElement = getFullscreenElement()
  const viewportHeight = fullscreenElement
    ? Math.max(window.innerHeight, window.screen?.height ?? 0)
    : window.visualViewport?.height ?? window.innerHeight

  document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`)
}

export function getFullscreenElement() {
  const fullscreenDocument = document as FullscreenDocument
  return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null
}

export async function requestDocumentFullscreen() {
  const element = (document.querySelector('#app') ?? document.documentElement) as FullscreenElement
  const request = element.requestFullscreen ?? element.webkitRequestFullscreen

  if (!request) {
    throw new Error('Fullscreen is not supported')
  }

  await request.call(element)
}

export async function exitDocumentFullscreen() {
  const fullscreenDocument = document as FullscreenDocument
  const exit = document.exitFullscreen ?? fullscreenDocument.webkitExitFullscreen

  if (!exit) {
    throw new Error('Exit fullscreen is not supported')
  }

  await exit.call(document)
}
