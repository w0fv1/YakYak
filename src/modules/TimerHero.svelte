<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { TimerReset } from 'lucide-svelte'
  import type { ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let remaining: number
  export let duration: number
  export let progress: number
  export let ringColor: string
  export let isWarning: boolean
  export let currentFiller: string

  const dispatch = createEventDispatcher<{
    settings: void
  }>()
</script>

<section class="flex h-[34svh] shrink-0 flex-col items-center justify-center py-3">
  <div class="relative">
    <button
      class="relative grid size-[min(45vw,182px)] max-h-[182px] min-h-[134px] min-w-[134px] cursor-pointer place-items-center rounded-full"
      aria-label="设置倒计时秒数"
      type="button"
      data-guide="timer"
      on:click={() => dispatch('settings')}
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
      data-guide="duration-tag"
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
        {currentFiller}
      </div>
    {/if}
  </div>
</section>
