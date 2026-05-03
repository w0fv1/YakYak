<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Download, Upload } from 'lucide-svelte'
  import ActionRow from '../components/ActionRow.svelte'
  import ModalShell from '../components/ModalShell.svelte'
  import type { ImportPreview, ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let importPreview: ImportPreview | undefined

  const dispatch = createEventDispatcher<{
    close: void
    import: void
    export: void
    cancelImport: void
    confirmImport: void
  }>()
</script>

<ModalShell
  {theme}
  title="词库数据"
  description="导入或导出 YakYak JSON"
  labelledBy="data-title"
  on:close={() => dispatch('close')}
>
  {#if importPreview}
    <div
      class={`mb-3 rounded-lg border p-3 ${
        theme === 'dark' ? 'border-cyan-300/20 bg-cyan-400/10' : 'border-cyan-200 bg-cyan-50'
      }`}
    >
      <div class="text-sm font-black">确认导入</div>
      <div class={`mt-1 truncate text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {importPreview.filename}
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <div>
          <div class="tabular-nums text-base font-black">{importPreview.flowCount}</div>
          <div class="text-zinc-500">流程词</div>
        </div>
        <div>
          <div class="tabular-nums text-base font-black">{importPreview.fillerCount}</div>
          <div class="text-zinc-500">万能句</div>
        </div>
        <div>
          <div class="tabular-nums text-base font-black">{importPreview.duration}s</div>
          <div class="text-zinc-500">倒计时</div>
        </div>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <button
          class={`rounded-lg border py-2 text-sm font-black ${
            theme === 'dark'
              ? 'border-white/10 bg-white/[0.06] active:bg-white/10'
              : 'border-zinc-200 bg-white active:bg-zinc-100'
          }`}
          type="button"
          on:click={() => dispatch('cancelImport')}
        >
          取消
        </button>
        <button
          class="rounded-lg bg-cyan-400 py-2 text-sm font-black text-zinc-950 active:bg-cyan-300"
          type="button"
          on:click={() => dispatch('confirmImport')}
        >
          确认导入
        </button>
      </div>
    </div>
  {/if}

  <div class="grid gap-2">
    <ActionRow
      {theme}
      title="导入词库"
      description="选择 YakYak 导出的 JSON 文件"
      tone="cyan"
      on:click={() => dispatch('import')}
    >
      <Upload slot="icon" size={18} />
    </ActionRow>

    <ActionRow
      {theme}
      title="导出词库"
      description="下载当前流程词和万能句"
      tone="emerald"
      on:click={() => dispatch('export')}
    >
      <Download slot="icon" size={18} />
    </ActionRow>
  </div>
</ModalShell>
