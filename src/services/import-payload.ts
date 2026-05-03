import { normalizeDuration } from './snapshots'
import type { AppSnapshot, ExportPayload, FlowLine, GuideState } from './types'
import { makeId } from '../utils/id'

export function normalizeImportPayload(
  payload: Partial<ExportPayload>,
  guideState: GuideState,
): AppSnapshot {
  if (!Array.isArray(payload.fillerPhrases) || !Array.isArray(payload.flowPhrases)) {
    throw new Error('Invalid YakYak data')
  }

  const flowPhrases = payload.flowPhrases
    .filter((item): item is FlowLine => Boolean(item && typeof item.text === 'string'))
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : makeId('flow', index),
      text: item.text,
    }))

  const knownIds = new Set(flowPhrases.map((item) => item.id))
  const visibleFlowIds = Array.isArray(payload.visibleFlowIds)
    ? payload.visibleFlowIds.filter((id): id is string => typeof id === 'string' && knownIds.has(id))
    : flowPhrases.map((item) => item.id)

  return {
    duration: normalizeDuration(Number(payload.duration)),
    theme: payload.theme === 'light' ? 'light' : 'dark',
    fillerPhrases: payload.fillerPhrases.filter((item): item is string => typeof item === 'string'),
    flowPhrases,
    visibleFlowIds,
    guide: guideState,
  }
}
