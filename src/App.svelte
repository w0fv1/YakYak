<script lang="ts">
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { Toaster, toast } from 'svelte-sonner'
  import {
    Check,
    ChevronDown,
    ChevronUp,
    Download,
    ListChecks,
    Moon,
    Pencil,
    Plus,
    RefreshCcw,
    Sun,
    TimerReset,
    Upload,
    X,
  } from 'lucide-svelte'

  type ThemeMode = 'dark' | 'light'
  type EditTab = 'fillers' | 'flow'
  type GestureMode = 'idle' | 'pending' | 'swipe'
  type FlowLine = {
    id: string
    text: string
  }
  type AppSnapshot = {
    duration: number
    theme: ThemeMode
    fillerPhrases: string[]
    flowPhrases: FlowLine[]
    visibleFlowIds: string[]
  }
  type ExportPayload = AppSnapshot & {
    app: 'YakYak'
    version: 1
    exportedAt: string
  }

  const dbName = 'yakyak-db'
  const dbVersion = 1
  const appStoreName = 'app'
  const snapshotKey = 'snapshot'
  const fillerStorageKey = 'say-words-fillers'
  const flowStorageKey = 'say-words-flow'
  const durationStorageKey = 'say-words-duration'
  const themeStorageKey = 'say-words-theme'

  const defaultFillers = [
    '我们先看这一波细节。',
    '这个点其实很关键。',
    '等一下，这里可能有变化。',
    '大家可以留意一下右上角。',
    '这个节奏现在挺舒服的。',
    '先别急，马上就有说法。',
    '我给大家补一句背景。',
    '这一下处理得很有意思。',
  ]

  const defaultFlow: FlowLine[] = [
    { id: 'flow-1', text: '开场：欢迎大家进来，今天先把重点讲清楚。' },
    { id: 'flow-2', text: '介绍：现在我们看的核心点是节奏、选择和结果。' },
    { id: 'flow-3', text: '互动：弹幕可以告诉我你们更想看哪个方向。' },
    { id: 'flow-4', text: '承接：刚才那一段说完，接下来要看下一步动作。' },
    { id: 'flow-5', text: '收束：这一轮先总结到这里，我们马上进入下一个环节。' },
  ]

  let duration = 8
  let remaining = 8
  let fillerPhrases = [...defaultFillers]
  let flowPhrases = defaultFlow.map((item) => ({ ...item }))
  let visibleFlowIds = flowPhrases.map((item) => item.id)
  let currentFiller = ''
  let theme: ThemeMode = 'dark'
  let editTab: EditTab = 'flow'
  let isEditOpen = false
  let isTimerOpen = false
  let timerInput = '8'
  let newFiller = ''
  let newFlowText = ''
  let hydrated = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let databasePromise: Promise<IDBDatabase> | undefined
  let importFileInput: HTMLInputElement | undefined

  let activeSwipeId = ''
  let gestureMode: GestureMode = 'idle'
  let swipeStartX = 0
  let swipeStartY = 0
  let swipeX = 0
  let completingFlowIds: string[] = []
  let collapsingFlowIds: string[] = []

  $: warningThreshold = Math.max(1, Math.ceil(duration / 3))
  $: isWarning = remaining <= warningThreshold
  $: progress = remaining / duration
  $: ringColor = isWarning ? '#ef4444' : '#22c55e'
  $: activeFlow = flowPhrases.filter((item) => visibleFlowIds.includes(item.id))
  $: finishedCount = flowPhrases.length - activeFlow.length
  $: snapshot = buildSnapshot(duration, theme, fillerPhrases, flowPhrases, visibleFlowIds)
  $: if (hydrated) {
    queueSnapshotSave(snapshot)
  }

  onMount(() => {
    void loadPersistedSnapshot()
    const timer = setInterval(tick, 1000)

    return () => {
      clearInterval(timer)
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
    }
  })

  async function loadPersistedSnapshot() {
    const snapshot = (await readSnapshot()) ?? readLegacySnapshot()
    if (snapshot) {
      applySnapshot(snapshot)
    }

    hydrated = true
    await writeSnapshot(buildSnapshot(duration, theme, fillerPhrases, flowPhrases, visibleFlowIds))
    clearLegacyStorage()
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

    fillerPhrases = nextFillers.length ? nextFillers : [...defaultFillers]
    flowPhrases = nextFlow.length ? nextFlow : defaultFlow.map((item) => ({ ...item }))

    const knownIds = new Set(flowPhrases.map((item) => item.id))
    visibleFlowIds = Array.isArray(snapshot.visibleFlowIds)
      ? snapshot.visibleFlowIds.filter((id) => knownIds.has(id))
      : flowPhrases.map((item) => item.id)
    currentFiller = ''
  }

  function buildSnapshot(
    currentDuration: number,
    currentTheme: ThemeMode,
    currentFillers: string[],
    currentFlow: FlowLine[],
    currentVisibleIds: string[],
  ): AppSnapshot {
    return {
      duration: currentDuration,
      theme: currentTheme,
      fillerPhrases: currentFillers,
      flowPhrases: currentFlow,
      visibleFlowIds: currentVisibleIds,
    }
  }

  function queueSnapshotSave(nextSnapshot: AppSnapshot) {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    saveTimer = setTimeout(() => {
      void writeSnapshot(nextSnapshot)
    }, 180)
  }

  function openDatabase() {
    databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion)

      request.onupgradeneeded = () => {
        request.result.createObjectStore(appStoreName)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return databasePromise
  }

  async function readSnapshot() {
    const database = await openDatabase()

    return new Promise<AppSnapshot | null>((resolve, reject) => {
      const transaction = database.transaction(appStoreName, 'readonly')
      const store = transaction.objectStore(appStoreName)
      const request = store.get(snapshotKey)

      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  }

  async function writeSnapshot(snapshot: AppSnapshot) {
    const database = await openDatabase()

    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(appStoreName, 'readwrite')
      const store = transaction.objectStore(appStoreName)
      const request = store.put(snapshot, snapshotKey)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  function readLegacySnapshot(): AppSnapshot | null {
    const savedDuration = Number(localStorage.getItem(durationStorageKey))
    const savedTheme = localStorage.getItem(themeStorageKey) as ThemeMode | null
    const savedFillers = readStoredArray<string>(fillerStorageKey)
    const savedFlow = readStoredArray<FlowLine>(flowStorageKey)

    if (!savedFillers?.length && !savedFlow?.length && !Number.isFinite(savedDuration)) {
      return null
    }

    const nextFlow = savedFlow?.length ? savedFlow : defaultFlow

    return {
      duration: normalizeDuration(savedDuration),
      theme: savedTheme === 'light' ? 'light' : 'dark',
      fillerPhrases: savedFillers?.length ? savedFillers : [...defaultFillers],
      flowPhrases: nextFlow,
      visibleFlowIds: nextFlow.map((item) => item.id),
    }
  }

  function clearLegacyStorage() {
    localStorage.removeItem(durationStorageKey)
    localStorage.removeItem(fillerStorageKey)
    localStorage.removeItem(flowStorageKey)
    localStorage.removeItem(themeStorageKey)
  }

  function readStoredArray<T>(key: string) {
    try {
      const value = localStorage.getItem(key)
      return value ? (JSON.parse(value) as T[]) : null
    } catch {
      return null
    }
  }

  function tick() {
    const next = remaining - 1

    if (next <= 0) {
      remaining = duration
      currentFiller = ''
      return
    }

    remaining = next

    if (next <= warningThreshold && !currentFiller) {
      currentFiller = randomFiller()
    }
  }

  function randomFiller() {
    if (!fillerPhrases.length) {
      return '先把这个节奏稳住。'
    }

    return fillerPhrases[Math.floor(Math.random() * fillerPhrases.length)]
  }

  function openTimerSettings() {
    timerInput = String(duration)
    isTimerOpen = true
  }

  function saveTimerSettings() {
    const nextDuration = normalizeDuration(Number(timerInput))
    duration = Number.isFinite(nextDuration) ? nextDuration : 8
    remaining = duration
    currentFiller = ''
    isTimerOpen = false
  }

  function normalizeDuration(value: number) {
    return Number.isFinite(value) ? Math.min(99, Math.max(3, Math.round(value))) : 8
  }

  function exportData() {
    const payload: ExportPayload = {
      app: 'YakYak',
      version: 1,
      exportedAt: new Date().toISOString(),
      ...snapshot,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `yakyak-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('已导出词库')
  }

  function selectImportFile() {
    importFileInput?.click()
  }

  async function importData(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    try {
      const payload = JSON.parse(await file.text()) as Partial<ExportPayload>
      const snapshot = normalizeImportPayload(payload)

      applySnapshot(snapshot)
      hydrated = true
      await writeSnapshot(snapshot)
      toast.success('已导入并保存到浏览器数据库')
    } catch {
      toast.error('导入失败，请确认是 YakYak 导出的 JSON 文件')
    }
  }

  function normalizeImportPayload(payload: Partial<ExportPayload>): AppSnapshot {
    if (!Array.isArray(payload.fillerPhrases) || !Array.isArray(payload.flowPhrases)) {
      throw new Error('Invalid YakYak data')
    }

    const flowPhrases = payload.flowPhrases
      .filter((item): item is FlowLine => Boolean(item && typeof item.text === 'string'))
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : makeId('flow', index),
        text: item.text,
      }))

    if (!flowPhrases.length) {
      throw new Error('No flow phrases')
    }

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
    }
  }

  function resetRound() {
    completingFlowIds = []
    collapsingFlowIds = []
    visibleFlowIds = flowPhrases.map((item) => item.id)
  }

  function removeForRound(id: string) {
    if (completingFlowIds.includes(id)) return

    const finishDirection = swipeX >= 0 ? 1 : -1
    activeSwipeId = id
    gestureMode = 'idle'
    swipeX = finishDirection * window.innerWidth
    completingFlowIds = [...completingFlowIds, id]

    window.setTimeout(() => {
      collapsingFlowIds = [...collapsingFlowIds, id]
    }, 120)

    window.setTimeout(() => {
      visibleFlowIds = visibleFlowIds.filter((itemId) => itemId !== id)
      completingFlowIds = completingFlowIds.filter((itemId) => itemId !== id)
      collapsingFlowIds = collapsingFlowIds.filter((itemId) => itemId !== id)
      if (activeSwipeId === id) {
        clearGesture()
      }
    }, 340)
  }

  function openEditor(tab: EditTab = 'flow') {
    editTab = tab
    isEditOpen = true
  }

  function addFiller() {
    const text = newFiller.trim()
    if (!text) return
    fillerPhrases = [...fillerPhrases, text]
    newFiller = ''
  }

  function addFlowLine() {
    const text = newFlowText.trim()
    if (!text) return
    const item = { id: makeId('flow'), text }
    flowPhrases = [...flowPhrases, item]
    visibleFlowIds = [...visibleFlowIds, item.id]
    newFlowText = ''
  }

  function updateFlowLine(id: string, text: string) {
    flowPhrases = flowPhrases.map((item) => (item.id === id ? { ...item, text } : item))
  }

  function updateFiller(index: number, text: string) {
    fillerPhrases = fillerPhrases.map((item, itemIndex) => (itemIndex === index ? text : item))
  }

  function deleteFlowLine(id: string) {
    flowPhrases = flowPhrases.filter((item) => item.id !== id)
    visibleFlowIds = visibleFlowIds.filter((itemId) => itemId !== id)
  }

  function deleteFiller(index: number) {
    fillerPhrases = fillerPhrases.filter((_, itemIndex) => itemIndex !== index)
  }

  function moveFlow(id: string, direction: -1 | 1) {
    const index = flowPhrases.findIndex((item) => item.id === id)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= flowPhrases.length) return

    const next = [...flowPhrases]
    const [item] = next.splice(index, 1)
    next.splice(targetIndex, 0, item)
    flowPhrases = next
  }

  function handlePointerDown(event: PointerEvent, id: string) {
    if (completingFlowIds.includes(id)) return
    if (event.button !== 0) return

    swipeStartX = event.clientX
    swipeStartY = event.clientY
    activeSwipeId = id
    gestureMode = 'pending'
    swipeX = 0
  }

  function handlePointerMove(event: PointerEvent, id: string) {
    if (activeSwipeId !== id) return

    const dx = event.clientX - swipeStartX
    const dy = event.clientY - swipeStartY

    if (gestureMode === 'pending' && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      activeSwipeId = ''
      gestureMode = 'idle'
      return
    }

    if (
      gestureMode === 'pending' &&
      Math.abs(dx) > 14 &&
      Math.abs(dx) > Math.abs(dy) * 1.25
    ) {
      gestureMode = 'swipe'
    }

    if (gestureMode === 'swipe') {
      event.preventDefault()
      swipeX = Math.max(-128, Math.min(128, dx))
    }
  }

  function handlePointerUp(id: string) {
    if (gestureMode === 'swipe' && activeSwipeId === id && Math.abs(swipeX) > 88) {
      removeForRound(id)
      return
    }

    clearGesture()
  }

  function clearGesture() {
    activeSwipeId = ''
    gestureMode = 'idle'
    swipeX = 0
  }

  function makeId(prefix: string, index = Date.now()) {
    return `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`
  }
</script>

<svelte:head>
  <meta name="theme-color" content={theme === 'dark' ? '#050505' : '#f7f7f2'} />
</svelte:head>

<main
  class={`h-svh overflow-hidden transition-colors duration-300 ${
    theme === 'dark' ? 'bg-[#050505] text-zinc-100' : 'bg-[#f7f7f2] text-zinc-950'
  }`}
>
  <div class="mx-auto flex h-svh w-full max-w-[560px] flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6">
    <header class="flex shrink-0 items-center justify-between gap-3">
      <div>
        <p
          class={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
          }`}
        >
          YakYak
        </p>
        <h1 class="mt-1 text-2xl font-black leading-none tracking-normal">说词儿啊！</h1>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          class={`grid size-9 place-items-center rounded-full border transition ${
            theme === 'dark'
              ? 'border-white/10 bg-white/[0.06] text-zinc-100 active:bg-white/10'
              : 'border-zinc-200 bg-white text-zinc-900 active:bg-zinc-100'
          }`}
          aria-label="导入数据"
          type="button"
          on:click={selectImportFile}
        >
          <Upload size={17} />
        </button>

        <button
          class={`grid size-9 place-items-center rounded-full border transition ${
            theme === 'dark'
              ? 'border-white/10 bg-white/[0.06] text-zinc-100 active:bg-white/10'
              : 'border-zinc-200 bg-white text-zinc-900 active:bg-zinc-100'
          }`}
          aria-label="导出数据"
          type="button"
          on:click={exportData}
        >
          <Download size={17} />
        </button>

        <button
          class={`grid size-9 place-items-center rounded-full border transition ${
            theme === 'dark'
              ? 'border-white/10 bg-white/[0.06] text-zinc-100 active:bg-white/10'
              : 'border-zinc-200 bg-white text-zinc-900 active:bg-zinc-100'
          }`}
          aria-label="切换明暗模式"
          type="button"
          on:click={() => (theme = theme === 'dark' ? 'light' : 'dark')}
        >
          {#if theme === 'dark'}
            <Sun size={17} />
          {:else}
            <Moon size={17} />
          {/if}
        </button>

        <button
          class={`grid size-9 place-items-center rounded-full border transition ${
            theme === 'dark'
              ? 'border-white/10 bg-white/[0.06] text-zinc-100 active:bg-white/10'
              : 'border-zinc-200 bg-white text-zinc-900 active:bg-zinc-100'
          }`}
          aria-label="编辑词库"
          type="button"
          on:click={() => openEditor('flow')}
        >
          <Pencil size={17} />
        </button>
      </div>
    </header>

    <section class="flex h-[34svh] shrink-0 flex-col items-center justify-center py-3">
      <div class="relative">
        <button
          class="relative grid size-[min(45vw,182px)] max-h-[182px] min-h-[134px] min-w-[134px] place-items-center rounded-full"
          aria-label="设置倒计时秒数"
          type="button"
          on:click={openTimerSettings}
        >
          <svg class="absolute inset-0 size-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(24,24,27,0.1)'}
              stroke-width="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={ringColor}
              stroke-linecap="round"
              stroke-width="8"
              stroke-dasharray="339.292"
              stroke-dashoffset={339.292 * (1 - progress)}
              class="transition-all duration-500"
            />
          </svg>

          <div class="relative text-center">
            <div class="tabular-nums text-5xl font-black leading-none tracking-normal sm:text-7xl">
              {remaining}
            </div>
          </div>
        </button>

        <div
          class={`absolute -right-3 top-3 inline-flex translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg ${
            isWarning
              ? 'bg-red-500/15 text-red-400'
              : theme === 'dark'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-emerald-600/10 text-emerald-700'
          }`}
        >
          <TimerReset size={14} />
          {duration}s
        </div>
      </div>

      <div class="mt-3 min-h-[50px] w-full">
        {#if isWarning}
          <div
            class={`mx-auto flex min-h-12 max-w-[420px] items-center justify-center rounded-lg border px-4 text-center text-sm font-semibold leading-snug ${
              theme === 'dark'
                ? 'border-red-400/25 bg-red-500/10 text-red-100'
                : 'border-red-200 bg-red-50 text-red-950'
            }`}
          >
            {currentFiller || randomFiller()}
          </div>
        {/if}
      </div>
    </section>

    <section class="flex min-h-0 flex-1 flex-col">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <div
            class={`grid size-9 shrink-0 place-items-center rounded-full ${
              theme === 'dark' ? 'bg-cyan-400/14 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
            }`}
          >
            <ListChecks size={18} />
          </div>
          <div class="min-w-0">
            <h2 class="text-lg font-black leading-tight tracking-normal">流程词</h2>
            <p class={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {activeFlow.length} 条待讲 · {finishedCount} 条已过
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <button
            class={`grid size-10 place-items-center rounded-full border transition ${
              theme === 'dark'
                ? 'border-white/10 bg-white/[0.06] active:bg-white/10'
                : 'border-zinc-200 bg-white active:bg-zinc-100'
            }`}
            aria-label="本轮重来"
            type="button"
            on:click={resetRound}
          >
            <RefreshCcw size={17} />
          </button>

          <button
            class={`grid size-10 place-items-center rounded-full border transition ${
              theme === 'dark'
                ? 'border-white/10 bg-white/[0.06] active:bg-white/10'
                : 'border-zinc-200 bg-white active:bg-zinc-100'
            }`}
            aria-label="编辑流程词"
            type="button"
            on:click={() => openEditor('flow')}
          >
            <Pencil size={17} />
          </button>
        </div>
      </div>

      <div class="momentum-scroll no-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2">
        {#if activeFlow.length}
          <div class="space-y-2.5">
            {#each activeFlow as item, index (item.id)}
              <article
                class={`group relative touch-pan-y select-none overflow-hidden rounded-lg border transition-all duration-[250ms] ease-out ${
                  index === 0
                    ? theme === 'dark'
                      ? 'border-cyan-300/70 bg-cyan-400/10 text-zinc-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_18px_48px_rgba(8,145,178,0.2)]'
                      : 'border-cyan-500 bg-cyan-50 text-zinc-950 shadow-[0_14px_34px_rgba(8,145,178,0.16)]'
                    : theme === 'dark'
                      ? 'border-white/10 bg-zinc-900 text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.24)]'
                      : 'border-zinc-200 bg-white text-zinc-950 shadow-[0_10px_30px_rgba(39,39,42,0.08)]'
                } ${
                  collapsingFlowIds.includes(item.id)
                    ? 'max-h-0 opacity-0'
                    : 'max-h-[180px] opacity-100'
                }`}
                on:pointerdown={(event) => handlePointerDown(event, item.id)}
                on:pointermove={(event) => handlePointerMove(event, item.id)}
                on:pointerup={() => handlePointerUp(item.id)}
                on:pointercancel={clearGesture}
              >
                <div
                  class={`absolute inset-0 flex items-center ${
                    activeSwipeId === item.id && swipeX > 0 ? 'justify-start pl-5' : 'justify-end pr-5'
                  } bg-emerald-500 text-emerald-950`}
                  aria-hidden="true"
                >
                  <div class="flex items-center gap-2 text-sm font-black">
                    <Check size={19} />
                    已完成
                  </div>
                </div>

                <div
                  class={`relative flex min-h-[74px] items-center gap-3 rounded-lg px-3 py-3 ${
                    index === 0
                      ? theme === 'dark'
                        ? 'bg-cyan-950/50'
                        : 'bg-cyan-50'
                      : theme === 'dark'
                        ? 'bg-zinc-900'
                        : 'bg-white'
                  }`}
                  style={`transform: translateX(${activeSwipeId === item.id ? swipeX : 0}px); transition: ${gestureMode === 'swipe' ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)'};`}
                >
                  <div
                    class={`flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-black tabular-nums ${
                      index === 0
                        ? 'bg-cyan-400 text-zinc-950'
                        : theme === 'dark'
                          ? 'bg-white/7 text-zinc-300'
                          : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[15px] font-semibold leading-snug tracking-normal">
                      {item.text}
                    </p>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        {:else}
          <div
            class={`grid min-h-[180px] place-items-center rounded-lg border border-dashed px-6 text-center ${
              theme === 'dark'
                ? 'border-white/12 bg-white/[0.03] text-zinc-400'
                : 'border-zinc-300 bg-white/70 text-zinc-500'
            }`}
          >
            <button
              class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                theme === 'dark'
                  ? 'bg-zinc-100 text-zinc-950 active:bg-white'
                  : 'bg-zinc-950 text-white active:bg-zinc-800'
              }`}
              type="button"
              on:click={resetRound}
            >
              <RefreshCcw size={16} />
              重来
            </button>
          </div>
        {/if}
      </div>
    </section>
  </div>
</main>

<input
  class="hidden"
  type="file"
  accept="application/json,.json"
  bind:this={importFileInput}
  on:change={importData}
/>

<Toaster
  theme={theme}
  position="top-center"
  richColors
  duration={2200}
  visibleToasts={2}
  mobileOffset={{ top: 14 }}
  offset={{ top: 18 }}
/>

{#if isTimerOpen}
  <div class="fixed inset-0 z-40 flex items-end p-3 sm:items-center sm:justify-center">
    <button
      class="absolute inset-0 bg-black/60 backdrop-blur-md"
      type="button"
      aria-label="关闭倒计时设置"
      on:click={() => (isTimerOpen = false)}
      transition:fade={{ duration: 160 }}
    ></button>
    <div class="modal-backdrop-effect pointer-events-none absolute inset-0" transition:fade={{ duration: 220 }}></div>
    <div
      class={`modal-panel relative w-full rounded-xl border p-4 shadow-2xl sm:max-w-sm ${
        theme === 'dark' ? 'border-white/10 bg-zinc-950 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-950'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-title"
      in:fly={{ y: 22, duration: 180 }}
      out:fly={{ y: 14, duration: 120 }}
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 id="timer-title" class="text-lg font-black tracking-normal">倒计时</h2>
        <button
          class="grid size-9 place-items-center rounded-full"
          type="button"
          aria-label="关闭"
          on:click={() => (isTimerOpen = false)}
        >
          <X size={18} />
        </button>
      </div>

      <label class="block text-sm font-bold" for="timer-seconds">秒数</label>
      <input
        id="timer-seconds"
        class={`mt-2 w-full rounded-lg border px-4 py-3 text-2xl font-black tabular-nums outline-none ${
          theme === 'dark'
            ? 'border-white/10 bg-white/[0.06] focus:border-emerald-400'
            : 'border-zinc-200 bg-zinc-50 focus:border-emerald-600'
        }`}
        type="number"
        min="3"
        max="99"
        bind:value={timerInput}
      />

      <div class="mt-4 flex gap-2">
        {#each [5, 8, 12, 15] as preset}
          <button
            class={`flex-1 rounded-lg border py-2 text-sm font-bold ${
              Number(timerInput) === preset
                ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                : theme === 'dark'
                  ? 'border-white/10 bg-white/[0.04]'
                  : 'border-zinc-200 bg-zinc-50'
            }`}
            type="button"
            on:click={() => (timerInput = String(preset))}
          >
            {preset}s
          </button>
        {/each}
      </div>

      <button
        class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-black text-zinc-950 active:bg-emerald-300"
        type="button"
        on:click={saveTimerSettings}
      >
        <Check size={18} />
        保存
      </button>
    </div>
  </div>
{/if}

{#if isEditOpen}
  <div class="fixed inset-0 z-50 flex items-end p-3 sm:items-center sm:justify-center">
    <button
      class="absolute inset-0 bg-black/60 backdrop-blur-md"
      type="button"
      aria-label="关闭编辑词库"
      on:click={() => (isEditOpen = false)}
      transition:fade={{ duration: 160 }}
    ></button>
    <div class="modal-backdrop-effect pointer-events-none absolute inset-0" transition:fade={{ duration: 220 }}></div>
    <div
      class={`modal-panel relative flex max-h-[92svh] w-full flex-col rounded-xl border shadow-2xl sm:max-w-lg ${
        theme === 'dark' ? 'border-white/10 bg-zinc-950 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-950'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
      in:fly={{ y: 22, duration: 180 }}
      out:fly={{ y: 14, duration: 120 }}
    >
      <div class="flex shrink-0 items-center justify-between border-b border-current/10 p-4">
        <h2 id="editor-title" class="text-lg font-black tracking-normal">编辑词库</h2>
        <button
          class="grid size-9 place-items-center rounded-full"
          type="button"
          aria-label="关闭"
          on:click={() => (isEditOpen = false)}
        >
          <X size={18} />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 p-3">
        <button
          class={`rounded-lg py-2 text-sm font-black ${
            editTab === 'flow'
              ? 'bg-cyan-400 text-zinc-950'
              : theme === 'dark'
                ? 'bg-white/[0.06] text-zinc-300'
                : 'bg-zinc-100 text-zinc-700'
          }`}
          type="button"
          on:click={() => (editTab = 'flow')}
        >
          流程词
        </button>
        <button
          class={`rounded-lg py-2 text-sm font-black ${
            editTab === 'fillers'
              ? 'bg-cyan-400 text-zinc-950'
              : theme === 'dark'
                ? 'bg-white/[0.06] text-zinc-300'
                : 'bg-zinc-100 text-zinc-700'
          }`}
          type="button"
          on:click={() => (editTab = 'fillers')}
        >
          万能句
        </button>
      </div>

      <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {#if editTab === 'flow'}
          <div class="mb-3 flex gap-2">
            <input
              class={`min-w-0 flex-1 rounded-lg border px-3 py-3 text-sm outline-none ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/[0.06] focus:border-cyan-400'
                  : 'border-zinc-200 bg-zinc-50 focus:border-cyan-600'
              }`}
              placeholder="新增流程词"
              bind:value={newFlowText}
              on:keydown={(event) => event.key === 'Enter' && addFlowLine()}
            />
            <button
              class="grid size-12 shrink-0 place-items-center rounded-lg bg-cyan-400 text-zinc-950 active:bg-cyan-300"
              type="button"
              aria-label="新增流程词"
              on:click={addFlowLine}
            >
              <Plus size={20} />
            </button>
          </div>

          <div class="space-y-2">
            {#each flowPhrases as item (item.id)}
              <div
                class={`flex gap-2 rounded-lg border p-2 ${
                  theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <textarea
                  class={`min-h-16 min-w-0 flex-1 resize-none rounded-md border px-3 py-2 text-sm leading-snug outline-none ${
                    theme === 'dark'
                      ? 'border-white/10 bg-zinc-950 focus:border-cyan-400'
                      : 'border-zinc-200 bg-white focus:border-cyan-600'
                  }`}
                  value={item.text}
                  on:input={(event) => updateFlowLine(item.id, event.currentTarget.value)}
                ></textarea>
                <div class="flex shrink-0 flex-col gap-1">
                  <button
                    class="grid size-8 place-items-center rounded-md"
                    type="button"
                    aria-label="上移"
                    on:click={() => moveFlow(item.id, -1)}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    class="grid size-8 place-items-center rounded-md"
                    type="button"
                    aria-label="下移"
                    on:click={() => moveFlow(item.id, 1)}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    class="grid size-8 place-items-center rounded-md text-red-400"
                    type="button"
                    aria-label="删除流程词"
                    on:click={() => deleteFlowLine(item.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="mb-3 flex gap-2">
            <input
              class={`min-w-0 flex-1 rounded-lg border px-3 py-3 text-sm outline-none ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/[0.06] focus:border-cyan-400'
                  : 'border-zinc-200 bg-zinc-50 focus:border-cyan-600'
              }`}
              placeholder="新增万能句"
              bind:value={newFiller}
              on:keydown={(event) => event.key === 'Enter' && addFiller()}
            />
            <button
              class="grid size-12 shrink-0 place-items-center rounded-lg bg-cyan-400 text-zinc-950 active:bg-cyan-300"
              type="button"
              aria-label="新增万能句"
              on:click={addFiller}
            >
              <Plus size={20} />
            </button>
          </div>

          <div class="space-y-2">
            {#each fillerPhrases as phrase, index}
              <div
                class={`flex gap-2 rounded-lg border p-2 ${
                  theme === 'dark' ? 'border-white/10 bg-white/[0.04]' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <input
                  class={`min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none ${
                    theme === 'dark'
                      ? 'border-white/10 bg-zinc-950 focus:border-cyan-400'
                      : 'border-zinc-200 bg-white focus:border-cyan-600'
                  }`}
                  value={phrase}
                  on:input={(event) => updateFiller(index, event.currentTarget.value)}
                />
                <button
                  class="grid size-10 shrink-0 place-items-center rounded-md text-red-400"
                  type="button"
                  aria-label="删除万能句"
                  on:click={() => deleteFiller(index)}
                >
                  <X size={17} />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="shrink-0 border-t border-current/10 p-3">
        <button
          class={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-black ${
            theme === 'dark'
              ? 'bg-zinc-100 text-zinc-950 active:bg-white'
              : 'bg-zinc-950 text-white active:bg-zinc-800'
          }`}
          type="button"
          on:click={() => (isEditOpen = false)}
        >
          <Check size={18} />
          完成
        </button>
      </div>
    </div>
  </div>
{/if}
