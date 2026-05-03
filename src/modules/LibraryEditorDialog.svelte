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
  const flowDragHandleZone: any = dragHandleZone

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

  function handleFlowSort(event: CustomEvent<{ items: FlowLine[] }>) {
    dispatch('sortFlow', event.detail.items.filter((item) => typeof item.text === 'string'))
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
  contentClass="flex min-h-0 flex-1 flex-col p-0"
  on:close={() => dispatch('close')}
>
  <div class="shrink-0 px-4 pb-3 pt-3">
    <div class={`mx-auto mb-3 h-1 w-10 rounded-full ${theme === 'dark' ? 'bg-white/16' : 'bg-zinc-300'}`}></div>
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 id="editor-title" class="text-lg font-black leading-tight tracking-normal">编辑词库</h2>
        <p class="mt-1 text-xs text-zinc-500">
          {flowPhrases.length} 条流程词 · {fillerCount} 条万能句
        </p>
      </div>
    </div>
  </div>

  <div
    class={`mx-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl p-1 ${
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

  <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
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
          items: flowPhrases,
          flipDurationMs: editorFlipDurationMs,
          dragHandleSelector: '[data-drag-handle]',
          morphDisabled: true,
          transformDraggedElement: styleDraggedEditorRow,
        }}
        on:consider={handleFlowSort}
        on:finalize={handleFlowSort}
        data-guide="editor-list"
        aria-label="流程词排序"
      >
        {#each flowPhrases as item (item.id)}
          <div animate:flip={{ duration: editorFlipDurationMs }}>
            {#if !isDndShadowItem(item)}
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

  <div class="shrink-0 border-t border-current/10 p-3">
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
