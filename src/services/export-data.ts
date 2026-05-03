import { downloadJson } from '../utils/download'
import { exportPayloadSchema } from './export-schema'
import { buildSnapshot } from './snapshots'
import type { ExportPayload, FlowLine, GuideState, ThemeMode } from './types'

export function exportYakYakData(
  duration: number,
  theme: ThemeMode,
  fillerPhrases: string[],
  flowPhrases: FlowLine[],
  visibleFlowIds: string[],
  guideState: GuideState,
) {
  const payload: ExportPayload = {
    app: 'YakYak',
    version: 1,
    exportedAt: new Date().toISOString(),
    schema: exportPayloadSchema,
    ...buildSnapshot(duration, theme, fillerPhrases, flowPhrases, visibleFlowIds, guideState),
  }

  downloadJson(`yakyak-${new Date().toISOString().slice(0, 10)}.json`, payload)
}
