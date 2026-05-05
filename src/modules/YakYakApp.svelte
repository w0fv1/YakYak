<script lang="ts">
  import { onMount, tick as afterDomUpdate } from 'svelte'
  import { Toaster, toast } from 'svelte-sonner'
  import AppHeader from './AppHeader.svelte'
  import DataDialog from './DataDialog.svelte'
  import FlowBoard from './FlowBoard.svelte'
  import LibraryEditorDialog from './LibraryEditorDialog.svelte'
  import RestoreDefaultsDialog from './RestoreDefaultsDialog.svelte'
  import SystemSettingsDialog from './SystemSettingsDialog.svelte'
  import TimerHero from './TimerHero.svelte'
  import TimerSettingsDialog from './TimerSettingsDialog.svelte'
  import { setupAppBrowserEvents } from '../services/app-events'
  import { updateDocumentTheme, type BeforeInstallPromptEvent } from '../services/browser'
  import { defaultDuration, defaultFillers, defaultFlow, defaultGuideState } from '../services/defaults'
  import { exportYakYakData } from '../services/export-data'
  import { toggleDocumentFullscreen } from '../services/fullscreen'
  import { getEditorGuideSteps, getMainGuideSteps, createYakYakGuide } from '../services/guide'
  import { normalizeImportPayload } from '../services/import-payload'
  import {
    clearLegacyStorage,
    readLegacySnapshot,
    readSnapshot,
    writeSnapshot,
  } from '../services/persistence'
  import { getPlatformCapabilities } from '../services/platform'
  import {
    buildDefaultSnapshot,
    buildFillerLines,
    buildSnapshot,
    normalizeDuration,
    normalizeGuideState,
  } from '../services/snapshots'
  import type {
    AppSnapshot,
    EditTab,
    ExportPayload,
    GuideState,
    ImportPreview,
    ThemeMode,
  } from '../services/types'
  import { makeId } from '../utils/id'
  import { pickRandom } from '../utils/random'
  import { promptPwaInstall } from '../services/pwa'
  import type { Driver } from 'driver.js'

  let duration = defaultDuration
  let remaining = defaultDuration
  let fillerLines = buildFillerLines(defaultFillers)
  let fillerPhrases = fillerLines.map((item) => item.text)
  let flowPhrases = defaultFlow.map((item) => ({ ...item }))
  let visibleFlowIds = flowPhrases.map((item) => item.id)
  let currentFiller = ''
  let theme: ThemeMode = 'dark'
  let editTab: EditTab = 'flow'
  let guideState: GuideState = { ...defaultGuideState }
  let activeGuide: Driver | undefined
  let deferredInstallPrompt: BeforeInstallPromptEvent | undefined
  let canInstallPwa = false
  let isFullscreen = false
  let isEditOpen = false
  let isTimerOpen = false
  let isDataOpen = false
  let isSystemOpen = false
  let isRestoreDefaultsOpen = false
  let timerInput = String(defaultDuration)
  let importPreview: ImportPreview | undefined
  let importFileInput: HTMLInputElement | undefined
  let hydrated = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let platformCapabilities = getPlatformCapabilities()

  $: warningThreshold = Math.max(1, Math.ceil(duration / 3))
  $: isWarning = remaining <= warningThreshold
  $: progress = remaining / duration
  $: ringColor = isWarning ? '#ef4444' : '#22c55e'
  $: fillerPhrases = fillerLines.map((item) => item.text)
  $: activeFlow = flowPhrases.filter((item) => visibleFlowIds.includes(item.id))
  $: finishedCount = flowPhrases.length - activeFlow.length
  $: updateDocumentTheme(theme)
  $: snapshot = buildSnapshot(duration, theme, fillerPhrases, flowPhrases, visibleFlowIds, guideState)
  $: if (hydrated) queueSnapshotSave(snapshot)

  onMount(() => {
    platformCapabilities = getPlatformCapabilities()
    const teardownBrowserEvents = setupAppBrowserEvents({
      onInstallPrompt: (event) => {
        deferredInstallPrompt = event
        canInstallPwa = true
      },
      onInstalled: () => {
        deferredInstallPrompt = undefined
        canInstallPwa = false
      },
      onFullscreenChange: (nextIsFullscreen) => {
        isFullscreen = nextIsFullscreen
      },
    })
    void loadPersistedSnapshot()
    const timer = setInterval(tickTimer, 1000)

    return () => {
      teardownBrowserEvents()
      clearInterval(timer)
      if (saveTimer) clearTimeout(saveTimer)
      activeGuide?.destroy()
    }
  })

  async function loadPersistedSnapshot() {
    const snapshot = (await readSnapshot()) ?? readLegacySnapshot()
    if (snapshot) applySnapshot(snapshot)

    const shouldAutoStartGuide = !guideState.completed
    if (shouldAutoStartGuide) {
      updateGuideState({
        completed: true,
        timerHintSeen: true,
        flowSwipeHintSeen: true,
        importExportHintSeen: true,
      })
    }

    hydrated = true
    await writeSnapshot(buildSnapshot(duration, theme, fillerPhrases, flowPhrases, visibleFlowIds, guideState))
    clearLegacyStorage()

    if (shouldAutoStartGuide) {
      window.setTimeout(() => startMainGuide(false), 420)
    }
  }

  function applySnapshot(snapshot: AppSnapshot) {
    duration = normalizeDuration(snapshot.duration)
    remaining = duration
    timerInput = String(duration)
    theme = snapshot.theme === 'light' ? 'light' : 'dark'

    const nextFillers = snapshot.fillerPhrases
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
    const nextFlow = snapshot.flowPhrases
      .filter((item) => typeof item?.text === 'string' && item.text.trim())
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : makeId('flow', index),
        text: item.text.trim(),
      }))

    fillerLines = buildFillerLines(nextFillers)
    flowPhrases = nextFlow

    const knownIds = new Set(flowPhrases.map((item) => item.id))
    visibleFlowIds = Array.isArray(snapshot.visibleFlowIds)
      ? snapshot.visibleFlowIds.filter((id) => knownIds.has(id))
      : flowPhrases.map((item) => item.id)
    guideState = normalizeGuideState(snapshot.guide)
    currentFiller = ''
  }

  function updateGuideState(patch: Partial<GuideState>) {
    guideState = { ...guideState, ...patch }
  }

  function queueSnapshotSave(nextSnapshot: AppSnapshot) {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void writeSnapshot(nextSnapshot), 180)
  }

  function saveSnapshotNow(nextSnapshot = snapshot) {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = undefined
    }
    void writeSnapshot(nextSnapshot)
  }

  function tickTimer() {
    const next = remaining - 1
    if (next <= 0) {
      remaining = duration
      currentFiller = ''
      return
    }

    remaining = next
    if (next <= warningThreshold && !currentFiller) {
      currentFiller = fillerPhrases.length ? pickRandom(fillerPhrases) : '说词儿啊！'
    }
  }

  function startMainGuide(markCompletedOnFinish = false) {
    activeGuide?.destroy()
    isSystemOpen = false
    isTimerOpen = false
    isEditOpen = false
    isDataOpen = false

    void afterDomUpdate().then(() => {
      activeGuide = createYakYakGuide(theme, getMainGuideSteps(), {
        doneText: '开始使用',
        onDestroyed: () => (activeGuide = undefined),
        onFinished: () => {
          if (!markCompletedOnFinish) return
          updateGuideState({
            completed: true,
            timerHintSeen: true,
            flowSwipeHintSeen: true,
            importExportHintSeen: true,
          })
        },
      })
      activeGuide.drive()
    })
  }

  function startEditorGuide() {
    if (!isEditOpen || guideState.editorHintSeen) return

    activeGuide?.destroy()
    activeGuide = createYakYakGuide(theme, getEditorGuideSteps(), {
      doneText: '知道了',
      onDestroyed: () => {
        activeGuide = undefined
        updateGuideState({ editorHintSeen: true })
      },
    })
    activeGuide.drive()
  }

  async function installPwa() {
    const result = await promptPwaInstall(deferredInstallPrompt)
    deferredInstallPrompt = undefined
    canInstallPwa = false

    if (result === 'unavailable') {
      toast.info('请用浏览器菜单添加；小米/MIUI 需先允许浏览器创建桌面快捷方式')
      return
    }

    toast.info(result === 'accepted' ? '已发起添加请求；如果桌面没有图标，请开启桌面快捷方式权限后重试' : '未添加到主屏幕')
  }

  async function toggleFullscreen() {
    try {
      const result = await toggleDocumentFullscreen()
      isFullscreen = result === 'entered'
      toast.success(result === 'entered' ? '已进入全屏' : '已退出全屏')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      toast.info(message.includes('not supported') ? '当前浏览器不支持网页全屏' : '浏览器没有允许全屏，请再点一次或检查权限')
    }
  }

  function openTimerSettings() {
    updateGuideState({ timerHintSeen: true })
    timerInput = String(duration)
    isTimerOpen = true
  }

  function saveTimerSettings() {
    duration = normalizeDuration(Number(timerInput))
    remaining = duration
    currentFiller = ''
    isTimerOpen = false
  }

  function exportData() {
    isDataOpen = false
    importPreview = undefined
    const nextGuideState = { ...guideState, importExportHintSeen: true }
    guideState = nextGuideState
    exportYakYakData(duration, theme, fillerPhrases, flowPhrases, visibleFlowIds, nextGuideState)
    toast.success('已导出词库')
  }

  async function importData(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    try {
      const payload = JSON.parse(await file.text()) as Partial<ExportPayload>
      const snapshot = normalizeImportPayload(payload, guideState)
      importPreview = {
        snapshot,
        filename: file.name,
        flowCount: snapshot.flowPhrases.length,
        fillerCount: snapshot.fillerPhrases.length,
        duration: snapshot.duration,
      }
      isDataOpen = true
    } catch {
      toast.error('导入失败，请确认是 YakYak 导出的 JSON 文件')
    }
  }

  async function confirmImportData() {
    if (!importPreview) return

    const nextSnapshot = {
      ...importPreview.snapshot,
      guide: { ...guideState, importExportHintSeen: true },
    }
    applySnapshot(nextSnapshot)
    hydrated = true
    await writeSnapshot(nextSnapshot)
    importPreview = undefined
    isDataOpen = false
    toast.success('已导入并保存到浏览器数据库')
  }

  function restoreDefaults() {
    importPreview = undefined
    isRestoreDefaultsOpen = false
    isSystemOpen = false
    const nextSnapshot = buildDefaultSnapshot(guideState)
    applySnapshot(nextSnapshot)
    saveSnapshotNow(nextSnapshot)
    toast.success('已恢复默认设置')
  }

  function openEditor(tab: EditTab = 'flow') {
    const shouldShowEditorGuide = !guideState.editorHintSeen
    editTab = tab
    isEditOpen = true

    if (shouldShowEditorGuide) {
      void afterDomUpdate().then(() => window.setTimeout(startEditorGuide, 180))
    }
  }

  function addFlowLine(text: string) {
    const item = { id: makeId('flow'), text }
    flowPhrases = [...flowPhrases, item]
    visibleFlowIds = [...visibleFlowIds, item.id]
  }

  function addFiller(text: string) {
    fillerLines = [...fillerLines, { id: makeId('filler'), text }]
  }

  function updateFlowLine(id: string, text: string) {
    flowPhrases = flowPhrases.map((item) => (item.id === id ? { ...item, text } : item))
  }

  function updateFiller(id: string, text: string) {
    fillerLines = fillerLines.map((item) => (item.id === id ? { ...item, text } : item))
  }

  function deleteFlowLine(id: string) {
    flowPhrases = flowPhrases.filter((item) => item.id !== id)
    visibleFlowIds = visibleFlowIds.filter((itemId) => itemId !== id)
    saveSnapshotNow()
  }

  function deleteFiller(id: string) {
    fillerLines = fillerLines.filter((item) => item.id !== id)
    saveSnapshotNow()
  }

  function completeFlow(id: string) {
    updateGuideState({ flowSwipeHintSeen: true })
    visibleFlowIds = visibleFlowIds.filter((itemId) => itemId !== id)
  }
</script>

<svelte:head>
  <meta name="theme-color" content={theme === 'dark' ? '#050505' : '#f7f7f2'} />
</svelte:head>

<main
  class={`min-h-[var(--app-height)] overflow-hidden transition-colors duration-300 ${
    theme === 'dark' ? 'bg-[#050505] text-zinc-100' : 'bg-[#f7f7f2] text-zinc-950'
  }`}
>
  <div class="mx-auto flex h-[var(--app-height)] w-full max-w-[560px] flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6">
    <AppHeader
      {theme}
      guideCompleted={guideState.completed}
      on:system={() => (isSystemOpen = true)}
      on:data={() => (isDataOpen = true)}
      on:toggleTheme={() => (theme = theme === 'dark' ? 'light' : 'dark')}
      on:edit={() => openEditor('flow')}
    />

    <TimerHero
      {theme}
      {remaining}
      {duration}
      {progress}
      {ringColor}
      {isWarning}
      {currentFiller}
      on:settings={openTimerSettings}
    />

    <FlowBoard
      {theme}
      {activeFlow}
      flowCount={flowPhrases.length}
      {finishedCount}
      on:reset={() => (visibleFlowIds = flowPhrases.map((item) => item.id))}
      on:edit={() => openEditor('flow')}
      on:complete={(event) => completeFlow(event.detail)}
    />
  </div>
</main>

<input
  bind:this={importFileInput}
  class="hidden"
  type="file"
  accept="application/json"
  on:change={importData}
/>

<Toaster
  {theme}
  position="top-center"
  richColors
  duration={2200}
  visibleToasts={2}
  mobileOffset={{ top: 14 }}
  offset={{ top: 18 }}
/>

{#if isSystemOpen}
  <SystemSettingsDialog
    {theme}
    {canInstallPwa}
    {isFullscreen}
    {platformCapabilities}
    on:close={() => (isSystemOpen = false)}
    on:install={installPwa}
    on:fullscreen={toggleFullscreen}
    on:guide={() => startMainGuide(true)}
    on:restoreDefaults={() => (isRestoreDefaultsOpen = true)}
  />
{/if}

{#if isRestoreDefaultsOpen}
  <RestoreDefaultsDialog
    {theme}
    on:cancel={() => (isRestoreDefaultsOpen = false)}
    on:confirm={restoreDefaults}
  />
{/if}

{#if isDataOpen}
  <DataDialog
    {theme}
    {importPreview}
    on:close={() => {
      importPreview = undefined
      isDataOpen = false
    }}
    on:import={() => {
      isDataOpen = false
      importFileInput?.click()
    }}
    on:export={exportData}
    on:cancelImport={() => (importPreview = undefined)}
    on:confirmImport={confirmImportData}
  />
{/if}

{#if isTimerOpen}
  <TimerSettingsDialog
    {theme}
    bind:timerInput
    on:close={() => (isTimerOpen = false)}
    on:save={saveTimerSettings}
  />
{/if}

{#if isEditOpen}
  <LibraryEditorDialog
    {theme}
    bind:editTab
    {flowPhrases}
    {fillerLines}
    fillerCount={fillerPhrases.length}
    on:close={() => (isEditOpen = false)}
    on:save={() => {
      isEditOpen = false
      saveSnapshotNow()
    }}
    on:addFlow={(event) => addFlowLine(event.detail)}
    on:addFiller={(event) => addFiller(event.detail)}
    on:updateFlow={(event) => updateFlowLine(event.detail.id, event.detail.text)}
    on:updateFiller={(event) => updateFiller(event.detail.id, event.detail.text)}
    on:deleteFlow={(event) => deleteFlowLine(event.detail)}
    on:deleteFiller={(event) => deleteFiller(event.detail)}
    on:sortFlow={(event) => (flowPhrases = event.detail)}
  />
{/if}
