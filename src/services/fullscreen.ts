import {
  exitDocumentFullscreen,
  getFullscreenElement,
  requestDocumentFullscreen,
  updateViewportHeight,
} from './browser'

export type FullscreenToggleResult = 'entered' | 'exited'

export async function toggleDocumentFullscreen(): Promise<FullscreenToggleResult> {
  if (getFullscreenElement()) {
    await exitDocumentFullscreen()
    updateViewportHeight()
    return 'exited'
  }

  updateViewportHeight()
  await requestDocumentFullscreen()
  updateViewportHeight()
  return 'entered'
}
