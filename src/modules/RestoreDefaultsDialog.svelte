<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { RefreshCcw, X } from 'lucide-svelte'
  import ModalShell from '../components/ModalShell.svelte'
  import type { ThemeMode } from '../services/types'

  export let theme: ThemeMode

  const dispatch = createEventDispatcher<{
    cancel: void
    confirm: void
  }>()
</script>

<ModalShell
  {theme}
  title="恢复默认"
  description="这会覆盖当前倒计时、主题、流程词和万能句。"
  labelledBy="restore-defaults-title"
  zIndex="z-[60]"
  on:close={() => dispatch('cancel')}
>
  <div
    class={`rounded-lg border px-4 py-3 text-sm font-semibold leading-relaxed ${
      theme === 'dark'
        ? 'border-rose-300/20 bg-rose-500/10 text-rose-50'
        : 'border-rose-200 bg-rose-50 text-rose-950'
    }`}
  >
    当前词库和设置会被默认内容替换。这个操作不会自动导出备份。
  </div>

  <div class="mt-4 grid grid-cols-2 gap-2">
    <button
      class={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black ${
        theme === 'dark'
          ? 'border-white/10 bg-white/[0.06] active:bg-white/10'
          : 'border-zinc-200 bg-white active:bg-zinc-100'
      }`}
      type="button"
      on:click={() => dispatch('cancel')}
    >
      <X size={17} />
      取消
    </button>

    <button
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-400 px-4 py-3 text-sm font-black text-zinc-950 active:bg-rose-300"
      type="button"
      on:click={() => dispatch('confirm')}
    >
      <RefreshCcw size={17} />
      恢复默认
    </button>
  </div>
</ModalShell>
