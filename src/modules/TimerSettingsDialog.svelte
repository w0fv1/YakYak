<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Check } from 'lucide-svelte'
  import ModalShell from '../components/ModalShell.svelte'
  import type { ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let timerInput: string

  const dispatch = createEventDispatcher<{
    close: void
    save: void
  }>()
</script>

<ModalShell
  {theme}
  title="倒计时"
  labelledBy="timer-title"
  on:close={() => dispatch('close')}
>
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
    on:click={() => dispatch('save')}
  >
    <Check size={18} />
    保存
  </button>
</ModalShell>
