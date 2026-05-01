<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { GripVertical, X } from 'lucide-svelte'

  type ThemeMode = 'dark' | 'light'
  type GestureMode = 'idle' | 'pending' | 'swipe' | 'drag'

  export let id: string
  export let value: string
  export let theme: ThemeMode
  export let multiline = false
  export let reorderable = false
  export let placeholder = ''

  const dispatch = createEventDispatcher<{
    change: string
    delete: void
    reorder: { targetId: string; placement: 'before' | 'after' }
  }>()

  let mode: GestureMode = 'idle'
  let startX = 0
  let startY = 0
  let swipeX = 0
  let dragY = 0
  let removing = false
  let longPressTimer: ReturnType<typeof setTimeout> | undefined

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0 || removing) return

    startX = event.clientX
    startY = event.clientY
    swipeX = 0
    dragY = 0
    mode = 'pending'

    const target = event.target as HTMLElement
    const canDrag = reorderable && Boolean(target.closest('[data-drag-handle]'))

    if (canDrag) {
      clearLongPress()
      longPressTimer = setTimeout(() => {
        mode = 'drag'
        navigator.vibrate?.(15)
      }, 360)
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (mode === 'idle' || removing) return

    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (mode === 'drag') {
      event.preventDefault()
      dragY = dy

      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-editor-row-id]')
      const targetId = target?.dataset.editorRowId

      if (targetId && targetId !== id) {
        const rect = target.getBoundingClientRect()
        const placement = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before'
        dispatch('reorder', { targetId, placement })
      }
      return
    }

    if (mode === 'pending' && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
      clearGesture()
      return
    }

    if (mode === 'pending' && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      clearLongPress()
      mode = 'swipe'
    }

    if (mode === 'swipe') {
      event.preventDefault()
      swipeX = Math.max(-128, Math.min(128, dx))
    }
  }

  function handlePointerUp() {
    if (mode === 'swipe' && Math.abs(swipeX) > 88) {
      completeDelete()
      return
    }

    clearGesture()
  }

  function completeDelete() {
    const direction = swipeX >= 0 ? 1 : -1
    swipeX = direction * window.innerWidth
    removing = true
    clearLongPress()

    window.setTimeout(() => {
      dispatch('delete')
      clearGesture()
      removing = false
    }, 220)
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = undefined
    }
  }

  function clearGesture() {
    clearLongPress()
    mode = 'idle'
    swipeX = 0
    dragY = 0
  }
</script>

<div
  data-editor-row-id={id}
  role="listitem"
  class={`relative touch-pan-y select-none overflow-hidden rounded-xl transition-all duration-200 ${
    removing ? 'max-h-0 opacity-0' : multiline ? 'max-h-32 opacity-100' : 'max-h-20 opacity-100'
  }`}
  on:pointerdown={handlePointerDown}
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={clearGesture}
>
  <div
    class={`absolute inset-0 flex items-center ${
      swipeX > 0 ? 'justify-start pl-5' : 'justify-end pr-5'
    } bg-red-500 text-white transition-opacity duration-100 ${
      Math.abs(swipeX) > 0 ? 'opacity-100' : 'opacity-0'
    }`}
    aria-hidden="true"
  >
    <div class="flex items-center gap-2 text-sm font-black">
      <X size={18} />
      删除
    </div>
  </div>

  <div
    class={`relative flex items-start gap-2 rounded-[inherit] px-3 py-2.5 shadow-sm ${
      theme === 'dark' ? 'bg-[#18181b]' : 'bg-white'
    } ${mode === 'drag' ? 'shadow-xl ring-1 ring-cyan-400/50' : ''}`}
    style={`transform: translate(${swipeX}px, ${mode === 'drag' ? dragY : 0}px); transition: ${
      mode === 'swipe' || mode === 'drag' ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)'
    };`}
  >
    {#if multiline}
      <textarea
        class={`min-h-16 min-w-0 flex-1 resize-none bg-transparent py-1 text-[15px] leading-snug outline-none ${
          theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-950 placeholder:text-zinc-400'
        }`}
        {placeholder}
        value={value}
        on:input={(event) => dispatch('change', event.currentTarget.value)}
      ></textarea>
    {:else}
      <input
        class={`min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none ${
          theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-950 placeholder:text-zinc-400'
        }`}
        {placeholder}
        value={value}
        on:input={(event) => dispatch('change', event.currentTarget.value)}
      />
    {/if}

    {#if reorderable}
      <button
        class={`mt-1 grid size-8 shrink-0 place-items-center rounded-full ${
          theme === 'dark' ? 'text-zinc-500 active:bg-white/10' : 'text-zinc-400 active:bg-zinc-100'
        }`}
        data-drag-handle
        aria-label="长按拖动排序"
        type="button"
      >
        <GripVertical size={17} />
      </button>
    {/if}
  </div>
</div>
