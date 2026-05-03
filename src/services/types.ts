export type ThemeMode = 'dark' | 'light'
export type EditTab = 'fillers' | 'flow'
export type GestureMode = 'idle' | 'pending' | 'swipe'

export type FlowLine = {
  id: string
  text: string
}

export type FillerLine = {
  id: string
  text: string
}

export type GuideState = {
  completed: boolean
  timerHintSeen: boolean
  flowSwipeHintSeen: boolean
  editorHintSeen: boolean
  importExportHintSeen: boolean
  timerHintDismissCount: number
}

export type AppSnapshot = {
  duration: number
  theme: ThemeMode
  fillerPhrases: string[]
  flowPhrases: FlowLine[]
  visibleFlowIds: string[]
  guide: GuideState
}

export type ExportPayload = AppSnapshot & {
  app: 'YakYak'
  version: 1
  exportedAt: string
  schema: Record<string, unknown>
}

export type ImportPreview = {
  snapshot: AppSnapshot
  filename: string
  flowCount: number
  fillerCount: number
  duration: number
}
