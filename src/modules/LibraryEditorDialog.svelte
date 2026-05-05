<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { flip } from 'svelte/animate'
  import { Check, Plus } from 'lucide-svelte'
  import {
    dragHandleZone,
    SHADOW_ITEM_MARKER_PROPERTY_NAME,
  } from 'svelte-dnd-action'
  import ModalShell from '../components/ModalShell.svelte'
  import SwipeEditableRow from '../components/SwipeEditableRow.svelte'
  import { editorFlipDurationMs } from '../services/defaults'
  import type { EditTab, FillerLine, FlowLine, ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let editTab: EditTab
  export let flowPhrases: FlowLine[]
  export let fillerLines: FillerLine[]
  export let fillerCount: number

  const dispatch = createEventDispatcher<{
    close: void
    save: void
    addFiller: string
    addFlow: string
    updateFlow: { id: string; text: string }
    updateFiller: { id: string; text: string }
    deleteFlow: string
    deleteFiller: string
    sortFlow: FlowLine[]
  }>()

  let newFiller = ''
  let newFlowText = ''
  let isSortingFlow = false
  let sortableFlowPhrases = flowPhrases
  const flowDragHandleZone: any = dragHandleZone

  $: if (!isSortingFlow) {
    sortableFlowPhrases = flowPhrases
  }

  function addFiller() {
    const text = newFiller.trim()
    if (!text) return

    dispatch('addFiller', text)
    newFiller = ''
  }

  function addFlowLine() {
    const text = newFlowText.trim()
    if (!text) return

    dispatch('addFlow', text)
    newFlowText = ''
  }

  function cleanFlowItems(items: FlowLine[]) {
    return items.filter((item) => typeof item.text === 'string' && !isDndShadowItem(item))
  }

  function handleFlowConsider(event: CustomEvent<{ items: FlowLine[] }>) {
    isSortingFlow = true
    sortableFlowPhrases = event.detail.items.filter((item) => typeof item.text === 'string')
  }

  function handleFlowFinalize(event: CustomEvent<{ items: FlowLine[] }>) {
    const nextItems = cleanFlowItems(event.detail.items)
    sortableFlowPhrases = nextItems
    isSortingFlow = false
    dispatch('sortFlow', nextItems)
  }

  function styleDraggedEditorRow(element?: HTMLElement) {
    element?.classList.add('editor-dnd-dragged')
  }

  function isDndShadowItem(item: FlowLine) {
    return Boolean((item as FlowLine & Record<string, unknown>)[SHADOW_ITEM_MARKER_PROPERTY_NAME])
  }
</script>

<ModalShell
  {theme}
  title="编辑词库"
  description={`${flowPhrases.length} 条流程词 · ${fillerCount} 条万能句`}
  labelledBy="editor-title"
  maxWidth="sm:max-w-lg"
  zIndex="z-50"
  panelClass={`flex max-h-[92svh] flex-col overflow-hidden rounded-2xl ${theme === 'dark' ? 'bg-[#09090b]' : ''}`}
  contentClass="flex min-h-0 flex-1 flex-col p-4"
  on:close={() => dispatch('close')}
>
  <div
    class={`grid shrink-0 grid-cols-2 gap-1 rounded-xl p-1 ${
      theme === 'dark' ? 'bg-white/[0.06]' : 'bg-zinc-100'
    }`}
    data-guide="editor-tabs"
  >
    <button
      class={`rounded-lg py-2.5 text-sm font-black transition ${
        editTab === 'flow'
          ? theme === 'dark'
            ? 'bg-cyan-400 text-zinc-950'
            : 'bg-cyan-600 text-white'
          : theme === 'dark'
            ? 'text-zinc-400'
            : 'text-zinc-500'
      }`}
      type="button"
      on:click={() => (editTab = 'flow')}
    >
      流程词
    </button>
    <button
      class={`rounded-lg py-2.5 text-sm font-black transition ${
        editTab === 'fillers'
          ? theme === 'dark'
            ? 'bg-cyan-400 text-zinc-950'
            : 'bg-cyan-600 text-white'
          : theme === 'dark'
            ? 'text-zinc-400'
            : 'text-zinc-500'
      }`}
      type="button"
      on:click={() => (editTab = 'fillers')}
    >
      万能句
    </button>
  </div>

  <div class="no-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1 pt-3">
    {#if editTab === 'flow'}
      <div class="sticky top-0 z-10 mb-4 flex gap-2 backdrop-blur" data-guide="editor-add">
        <input
          class={`min-w-0 flex-1 rounded-lg border px-3 py-3 text-sm outline-none ${
            theme === 'dark'
              ? 'border-white/10 bg-[#09090b]/95 focus:border-cyan-400'
              : 'border-zinc-200 bg-white/95 focus:border-cyan-600'
          }`}
          bind:value={newFlowText}
          placeholder="新增流程词"
          on:keydown={(event) => event.key === 'Enter' && addFlowLine()}
        />
        <button
          class="grid size-12 shrink-0 place-items-center rounded-lg bg-cyan-400 text-zinc-950 shadow-[0_10px_24px_rgba(34,211,238,0.2)] active:bg-cyan-300"
          type="button"
          aria-label="新增流程词"
          on:click={addFlowLine}
        >
          <Plus size={20} />
        </button>
      </div>

      <div
        class="space-y-3 cursor-default"
        use:flowDragHandleZone={{
          items: sortableFlowPhrases,
          flipDurationMs: editorFlipDurationMs,
          delayTouchStart: 120,
          morphDisabled: true,
          useCursorForDetection: true,
          transformDraggedElement: styleDraggedEditorRow,
        }}
        on:consider={handleFlowConsider}
        on:finalize={handleFlowFinalize}
        data-guide="editor-list"
        aria-label="流程词排序"
      >
        {#each sortableFlowPhrases as item (`${item.id}-${isDndShadowItem(item) ? 'shadow' : 'item'}`)}
          <div
            animate:flip={{ duration: editorFlipDurationMs }}
            data-is-dnd-shadow-item-hint={isDndShadowItem(item) ? 'true' : undefined}
            role={isDndShadowItem(item) ? 'presentation' : undefined}
            aria-hidden={isDndShadowItem(item) ? 'true' : undefined}
          >
            {#if isDndShadowItem(item)}
              <div class="flex h-full min-h-[58px] items-center justify-center rounded-xl text-xs font-black text-cyan-200/80">
                放到这里
              </div>
            {:else}
              <SwipeEditableRow
                id={item.id}
                value={item.text}
                {theme}
                multiline
                reorderable
                ariaLabel={item.text || '流程词'}
                placeholder="流程词"
                on:change={(event) => dispatch('updateFlow', { id: item.id, text: event.detail })}
                on:delete={() => dispatch('deleteFlow', item.id)}
              />
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="sticky top-0 z-10 mb-4 flex gap-2 backdrop-blur" data-guide="editor-add">
        <input
          class={`min-w-0 flex-1 rounded-lg border px-3 py-3 text-sm outline-none ${
            theme === 'dark'
              ? 'border-white/10 bg-[#09090b]/95 focus:border-cyan-400'
              : 'border-zinc-200 bg-white/95 focus:border-cyan-600'
          }`}
          bind:value={newFiller}
          placeholder="新增万能句"
          on:keydown={(event) => event.key === 'Enter' && addFiller()}
        />
        <button
          class="grid size-12 shrink-0 place-items-center rounded-lg bg-cyan-400 text-zinc-950 shadow-[0_10px_24px_rgba(34,211,238,0.2)] active:bg-cyan-300"
          type="button"
          aria-label="新增万能句"
          on:click={addFiller}
        >
          <Plus size={20} />
        </button>
      </div>

      <div class="space-y-3" role="list" aria-label="万能句列表" data-guide="editor-list">
        {#each fillerLines as item (item.id)}
          <SwipeEditableRow
            id={item.id}
            value={item.text}
            {theme}
            placeholder="万能句"
            on:change={(event) => dispatch('updateFiller', { id: item.id, text: event.detail })}
            on:delete={() => dispatch('deleteFiller', item.id)}
          />
        {/each}
      </div>
    {/if}
  </div>

  <div class="-mx-4 -mb-4 mt-3 shrink-0 border-t border-current/10 p-3">
    <button
      class={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-black ${
        theme === 'dark' ? 'bg-emerald-400 text-zinc-950' : 'bg-emerald-600 text-white'
      }`}
      type="button"
      on:click={() => dispatch('save')}
    >
      <Check size={18} />
      保存并关闭
    </button>
  </div>
</ModalShell>
