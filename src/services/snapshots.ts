import { defaultDuration, defaultFillers, defaultFlow, defaultGuideState } from './defaults'
import type { AppSnapshot, FillerLine, FlowLine, GuideState, ThemeMode } from './types'
import { makeId } from '../utils/id'

export function buildSnapshot(
  currentDuration: number,
  currentTheme: ThemeMode,
  currentFillers: string[],
  currentFlow: FlowLine[],
  currentVisibleIds: string[],
  currentGuide: GuideState,
): AppSnapshot {
  return {
    duration: currentDuration,
    theme: currentTheme,
    fillerPhrases: currentFillers,
    flowPhrases: currentFlow,
    visibleFlowIds: currentVisibleIds,
    guide: currentGuide,
  }
}

export function buildDefaultSnapshot(currentGuide: GuideState): AppSnapshot {
  const defaultFlowPhrases = defaultFlow.map((item) => ({ ...item }))

  return {
    duration: defaultDuration,
    theme: 'dark',
    fillerPhrases: [...defaultFillers],
    flowPhrases: defaultFlowPhrases,
    visibleFlowIds: defaultFlowPhrases.map((item) => item.id),
    guide: currentGuide,
  }
}

export function normalizeDuration(value: number) {
  return Number.isFinite(value)
    ? Math.min(99, Math.max(3, Math.round(value)))
    : defaultDuration
}

export function normalizeGuideState(value: Partial<GuideState> | undefined): GuideState {
  return {
    ...defaultGuideState,
    ...value,
    completed: Boolean(value?.completed),
    timerHintSeen: Boolean(value?.timerHintSeen),
    flowSwipeHintSeen: Boolean(value?.flowSwipeHintSeen),
    editorHintSeen: Boolean(value?.editorHintSeen),
    importExportHintSeen: Boolean(value?.importExportHintSeen),
    timerHintDismissCount: Number.isFinite(value?.timerHintDismissCount)
      ? Number(value?.timerHintDismissCount)
      : 0,
  }
}

export function buildFillerLines(phrases: string[]): FillerLine[] {
  return phrases.map((text, index) => ({
    id: makeId('filler', index),
    text,
  }))
}
