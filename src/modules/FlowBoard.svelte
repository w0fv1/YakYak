<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Check, ListChecks, Pencil, RefreshCcw } from 'lucide-svelte'
  import type { FlowLine, GestureMode, ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let activeFlow: FlowLine[]
  export let flowCount: number
  export let finishedCount: number

  const dispatch = createEventDispatcher<{
    reset: void
    edit: void
    complete: string
  }>()

  let activeSwipeId = ''
  let activeSwipePointerId: number | undefined
  let gestureMode: GestureMode = 'idle'
  let swipeStartX = 0
  let swipeStartY = 0
  let swipeX = 0
  let completingFlowIds: string[] = []
  let collapsingFlowIds: string[] = []

  function completeFlow(id: string, direction = swipeX >= 0 ? 1 : -1) {
    if (completingFlowIds.includes(id)) return

    activeSwipeId = id
    gestureMode = 'idle'
    swipeX = direction * window.innerWidth
    completingFlowIds = [...completingFlowIds, id]

    window.setTimeout(() => {
      collapsingFlowIds = [...collapsingFlowIds, id]
    }, 120)

    window.setTimeout(() => {
      dispatch('complete', id)
      completingFlowIds = completingFlowIds.filter((itemId) => itemId !== id)
      collapsingFlowIds = collapsingFlowIds.filter((itemId) => itemId !== id)
      if (activeSwipeId === id) {
        clearGesture()
      }
    }, 340)
  }

  function handleDoubleClick(event: MouseEvent, id: string) {
    event.preventDefault()
    completeFlow(id, 1)
  }

  function handlePointerDown(event: PointerEvent, id: string) {
    if (completingFlowIds.includes(id)) return
    if (event.button !== 0) return

    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    activeSwipePointerId = event.pointerId
    swipeStartX = event.clientX
    swipeStartY = event.clientY
    activeSwipeId = id
    gestureMode = 'pending'
    swipeX = 0
  }

  function handlePointerMove(event: PointerEvent, id: string) {
    if (activeSwipePointerId !== event.pointerId) return
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

  function handlePointerUp(event: PointerEvent, id: string) {
    if (activeSwipePointerId !== event.pointerId) return

    if (gestureMode === 'swipe' && activeSwipeId === id && Math.abs(swipeX) > 88) {
      completeFlow(id)
      return
    }

    clearGesture()
  }

  function clearGesture() {
    activeSwipeId = ''
    activeSwipePointerId = undefined
    gestureMode = 'idle'
    swipeX = 0
  }

  $: buttonTheme =
    theme === 'dark'
      ? 'border-white/10 bg-white/[0.06] active:bg-white/10'
      : 'border-zinc-200 bg-white active:bg-zinc-100'
</script>

<section class="flex min-h-0 flex-1 flex-col" data-guide="flow-section">
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
        <div class="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span class={`inline-flex items-center gap-1 ${theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700'}`}>
            剩余
            <span class="tabular-nums">{activeFlow.length}</span>
          </span>
          <span class={theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'}>·</span>
          <span class={`inline-flex items-center gap-1 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
            完成
            <span class="tabular-nums">{finishedCount}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <button
        class={`grid size-10 place-items-center rounded-full border transition ${buttonTheme}`}
        aria-label="本轮重来"
        type="button"
        on:click={() => dispatch('reset')}
      >
        <RefreshCcw size={17} />
      </button>

      <button
        class={`grid size-10 place-items-center rounded-full border transition ${buttonTheme}`}
        aria-label="编辑流程词"
        type="button"
        on:click={() => dispatch('edit')}
      >
        <Pencil size={17} />
      </button>
    </div>
  </div>

  <div class="no-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2 [scroll-behavior:auto] [-webkit-overflow-scrolling:touch]">
    {#if activeFlow.length}
      <div class="space-y-2.5">
        {#each activeFlow as item, index (item.id)}
          <article
            data-guide={index === 0 ? 'active-flow-item' : undefined}
            class={`group relative cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-lg border transition-all duration-[250ms] ease-out active:cursor-grabbing ${
              index === 0
                ? theme === 'dark'
                  ? 'border-cyan-300/70 bg-cyan-400/10 text-zinc-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_18px_48px_rgba(8,145,178,0.2)]'
                  : 'border-cyan-500 bg-cyan-50 text-zinc-950 shadow-[0_14px_34px_rgba(8,145,178,0.16)]'
                : theme === 'dark'
                  ? 'border-white/10 bg-zinc-900 text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.24)]'
                  : 'border-zinc-200 bg-white text-zinc-950 shadow-[0_10px_30px_rgba(39,39,42,0.08)]'
            } ${collapsingFlowIds.includes(item.id) ? 'max-h-0 opacity-0' : 'max-h-[180px] opacity-100'}`}
            on:pointerdown={(event) => handlePointerDown(event, item.id)}
            on:pointermove={(event) => handlePointerMove(event, item.id)}
            on:pointerup={(event) => handlePointerUp(event, item.id)}
            on:pointercancel={clearGesture}
            on:dblclick={(event) => handleDoubleClick(event, item.id)}
          >
            <div
              class={`absolute inset-0 flex items-center ${
                activeSwipeId === item.id && swipeX > 0 ? 'justify-start pl-5' : 'justify-end pr-5'
              } bg-emerald-500 text-emerald-950 transition-opacity duration-100 ${
                activeSwipeId === item.id && Math.abs(swipeX) > 0 ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            >
              <div class="flex items-center gap-2 text-sm font-black">
                <Check size={19} />
                已完成
              </div>
            </div>

            <div
              class={`relative flex min-h-[74px] items-center gap-3 rounded-[inherit] px-3 py-3 ${
                index === 0
                  ? theme === 'dark'
                    ? 'bg-[#083344]'
                    : 'bg-cyan-50'
                  : theme === 'dark'
                    ? 'bg-[#18181b]'
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
    {:else if flowCount}
      <div
        class={`grid min-h-[180px] place-items-center rounded-lg border border-dashed px-6 text-center ${
          theme === 'dark'
            ? 'border-white/12 bg-white/[0.03] text-zinc-400'
            : 'border-zinc-300 bg-white/70 text-zinc-500'
        }`}
      >
        <div class="flex flex-col items-center gap-3">
          <div>
            <p class="text-sm font-black">本轮已完成</p>
            <p class="mt-1 text-xs font-semibold opacity-75">重来后会恢复本轮流程词。</p>
          </div>
          <button
            class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
              theme === 'dark' ? 'bg-emerald-400 text-zinc-950' : 'bg-emerald-600 text-white'
            }`}
            type="button"
            on:click={() => dispatch('reset')}
          >
            <RefreshCcw size={16} />
            本轮重来
          </button>
        </div>
      </div>
    {:else}
      <div
        class={`grid min-h-[180px] place-items-center rounded-lg border border-dashed px-6 text-center ${
          theme === 'dark'
            ? 'border-white/12 bg-white/[0.03] text-zinc-400'
            : 'border-zinc-300 bg-white/70 text-zinc-500'
        }`}
      >
        <div class="flex flex-col items-center gap-3">
          <div>
            <p class="text-sm font-black">没有流程词</p>
            <p class="mt-1 text-xs font-semibold opacity-75">去编辑词库添加本轮要讲的内容。</p>
          </div>
          <button
            class={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
              theme === 'dark' ? 'bg-cyan-400 text-zinc-950' : 'bg-cyan-600 text-white'
            }`}
            type="button"
            on:click={() => dispatch('edit')}
          >
            <Pencil size={16} />
            编辑流程词
          </button>
        </div>
      </div>
    {/if}
  </div>
</section>
