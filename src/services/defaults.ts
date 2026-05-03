import type { FlowLine, GuideState } from './types'

export const editorFlipDurationMs = 180
export const defaultDuration = 8

export const defaultFillers = [
  '我们先看这一波细节。',
  '这个点其实很关键。',
  '等一下，这里可能有变化。',
  '大家可以留意一下右上角。',
  '这个节奏现在挺舒服的。',
  '先别急，马上就有说法。',
  '我给大家补一句背景。',
  '这一下处理得很有意思。',
]

export const defaultFlow: FlowLine[] = [
  { id: 'flow-1', text: '开场：欢迎大家进来，今天先把重点讲清楚。' },
  { id: 'flow-2', text: '介绍：现在我们看的核心点是节奏、选择和结果。' },
  { id: 'flow-3', text: '互动：弹幕可以告诉我你们更想看哪个方向。' },
  { id: 'flow-4', text: '承接：刚才那一段说完，接下来要看下一步动作。' },
  { id: 'flow-5', text: '收束：这一轮先总结到这里，我们马上进入下一个环节。' },
]

export const defaultGuideState: GuideState = {
  completed: false,
  timerHintSeen: false,
  flowSwipeHintSeen: false,
  editorHintSeen: false,
  importExportHintSeen: false,
  timerHintDismissCount: 0,
}
