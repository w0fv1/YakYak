export const exportPayloadSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'YakYak Export Payload',
  description:
    'YakYak 词库与运行配置。AI 可以编辑 duration、theme、fillerPhrases、flowPhrases、visibleFlowIds 和 guide；请保持 JSON 有效。',
  type: 'object',
  required: [
    'app',
    'version',
    'exportedAt',
    'duration',
    'theme',
    'fillerPhrases',
    'flowPhrases',
    'visibleFlowIds',
    'guide',
  ],
  properties: {
    app: {
      const: 'YakYak',
      description: '固定应用标识。',
    },
    version: {
      const: 1,
      description: '导出格式版本。',
    },
    exportedAt: {
      type: 'string',
      format: 'date-time',
      description: '导出时间，ISO 8601 字符串。',
    },
    duration: {
      type: 'integer',
      minimum: 3,
      maximum: 99,
      description: '倒计时间隔秒数。导入时会被规范化到 3 到 99 的整数。',
    },
    theme: {
      enum: ['dark', 'light'],
      description: '界面主题。',
    },
    fillerPhrases: {
      type: 'array',
      description:
        '万能句列表。倒计时进入最后三分之一时随机显示；可以为空，为空时应用显示“说词儿啊！”。',
      items: {
        type: 'string',
      },
    },
    flowPhrases: {
      type: 'array',
      description:
        '流程词列表。顺序即展示顺序；可以为空，为空时主页会引导前去编辑。',
      items: {
        type: 'object',
        required: ['id', 'text'],
        properties: {
          id: {
            type: 'string',
            minLength: 1,
            description:
              '流程词唯一 ID。建议保持稳定；新增时可用 flow-简短英文或 flow-数字。',
          },
          text: {
            type: 'string',
            description: '流程词正文。',
          },
        },
        additionalProperties: true,
      },
    },
    visibleFlowIds: {
      type: 'array',
      description:
        '本轮尚未完成的流程词 ID。通常应是 flowPhrases 中 id 的子集；想重置本轮时可填入全部流程词 id。',
      items: {
        type: 'string',
      },
    },
    guide: {
      type: 'object',
      description: '新手引导状态。AI 通常可以保留原值。',
      required: [
        'completed',
        'timerHintSeen',
        'flowSwipeHintSeen',
        'editorHintSeen',
        'importExportHintSeen',
        'timerHintDismissCount',
      ],
      properties: {
        completed: { type: 'boolean' },
        timerHintSeen: { type: 'boolean' },
        flowSwipeHintSeen: { type: 'boolean' },
        editorHintSeen: { type: 'boolean' },
        importExportHintSeen: { type: 'boolean' },
        timerHintDismissCount: {
          type: 'integer',
          minimum: 0,
        },
      },
      additionalProperties: true,
    },
    schema: {
      type: 'object',
      description: '本字段，描述 YakYak 导出 JSON 的格式；导入时会被忽略。',
    },
  },
  additionalProperties: true,
} as const
