import { driver, type DriveStep, type Driver } from 'driver.js'
import type { ThemeMode } from './types'

function guideElement(selector: string, fallback = 'main') {
  return () =>
    document.querySelector(selector) ??
    document.querySelector(fallback) ??
    document.body
}

export function getMainGuideSteps(): DriveStep[] {
  return [
    {
      element: guideElement('main'),
      popover: {
        title: '说词儿啊！',
        description: '帮主播盯住说话节奏、准备救场话术，并按流程推进直播，减少冷场和漏讲。',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: guideElement('[data-guide="timer"]'),
      popover: {
        title: '关注倒计时',
        description: '在这个时间内，你至少要讲一句词儿。圆环会一直循环。进入最后三分之一时，下面会出现万能句，提醒你及时接话。',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: guideElement('[data-guide="timer"]'),
      popover: {
        title: '调整说话间隔',
        description: '点击倒计时可以设置秒数，比如 5 秒、8 秒或 12 秒。',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: guideElement('[data-guide="active-flow-item"]', '[data-guide="flow-section"]'),
      popover: {
        title: '按流程往下讲',
        description: '最上面的流程词会高亮。讲完一条，左右滑动或双击即可标记为已完成。',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: guideElement('[data-guide="edit-button"]'),
      popover: {
        title: '把它改成你的词儿',
        description: '编辑词库可以添加流程词和万能句。流程词支持长按排序。',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: guideElement('[data-guide="library-actions"]'),
      popover: {
        title: '备份你的词库',
        description: '导出 JSON 可以备份词库；换设备时再导入，就能继续使用。',
        side: 'bottom',
        align: 'end',
      },
    },
  ]
}

export function getEditorGuideSteps(): DriveStep[] {
  return [
    {
      element: guideElement('[data-guide="editor-tabs"]'),
      popover: {
        title: '两类词库',
        description: '流程词用于直播步骤，万能句用于倒计时变红时随机提醒。',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: guideElement('[data-guide="editor-add"]'),
      popover: {
        title: '快速新增',
        description: '输入一句话后点加号，就会保存到当前词库。',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: guideElement('[data-guide="editor-list"]'),
      popover: {
        title: '整理顺序',
        description: '流程词可以按住右侧手柄上下拖动排序；左右滑动可以删除。',
        side: 'top',
        align: 'center',
      },
    },
  ]
}

export function createYakYakGuide(
  theme: ThemeMode,
  steps: DriveStep[],
  options: {
    doneText?: string
    onFinished?: () => void
    onDestroyed?: () => void
  } = {},
) {
  let guide: Driver | undefined

  guide = driver({
    steps,
    animate: true,
    smoothScroll: false,
    allowClose: true,
    overlayColor: '#020617',
    overlayOpacity: theme === 'dark' ? 0.72 : 0.38,
    stagePadding: 8,
    stageRadius: 14,
    popoverClass: `yakyak-driver yakyak-driver-${theme}`,
    showButtons: ['previous', 'next', 'close'],
    showProgress: true,
    progressText: '{{current}}/{{total}}',
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    doneBtnText: options.doneText ?? '知道了',
    onDestroyed: () => {
      const activeIndex = guide?.getActiveIndex()
      options.onDestroyed?.()

      if (activeIndex !== undefined && activeIndex >= steps.length - 1) {
        options.onFinished?.()
      }
    },
  })

  return guide
}
