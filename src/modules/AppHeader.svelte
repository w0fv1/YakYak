<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Download, Moon, Pencil, Settings, Sun } from 'lucide-svelte'
  import type { ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let guideCompleted = true

  const dispatch = createEventDispatcher<{
    system: void
    data: void
    toggleTheme: void
    edit: void
  }>()

  $: buttonTheme =
    theme === 'dark'
      ? 'border-white/10 bg-white/[0.06] text-zinc-100 active:bg-white/10'
      : 'border-zinc-200 bg-white text-zinc-900 active:bg-zinc-100'
</script>

<header class="flex shrink-0 items-center justify-between gap-3">
  <div class="min-w-0">
    <div class="flex min-w-0 items-end gap-2">
      <h1 class="text-2xl font-black leading-none tracking-normal">说词儿啊！</h1>
      <a
        class={`mb-[1px] shrink-0 rounded-full border px-2 py-1 text-[11px] font-black leading-none transition ${
          theme === 'dark'
            ? 'border-white/10 bg-white/[0.06] text-cyan-200 hover:bg-white/10'
            : 'border-zinc-200 bg-white text-cyan-700 hover:bg-zinc-50'
        }`}
        href="https://w0fv1.dev/"
        target="_blank"
        rel="noreferrer"
        aria-label="打开作者 w0fv1 的网站"
      >
        @w0fv1
      </a>
    </div>
    <p class="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
      YakYak
    </p>
  </div>

  <div class="flex shrink-0 items-center gap-1.5">
    <button
      class={`relative grid size-9 place-items-center rounded-full border transition ${buttonTheme}`}
      aria-label="系统"
      type="button"
      data-guide="help-button"
      on:click={() => dispatch('system')}
    >
      <Settings size={17} />
      {#if !guideCompleted}
        <span class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-cyan-300"></span>
      {/if}
    </button>

    <button
      class={`grid size-9 place-items-center rounded-full border transition ${buttonTheme}`}
      aria-label="导入导出数据"
      type="button"
      data-guide="library-actions"
      on:click={() => dispatch('data')}
    >
      <Download size={17} />
    </button>

    <button
      class={`grid size-9 place-items-center rounded-full border transition ${buttonTheme}`}
      aria-label="切换明暗模式"
      type="button"
      on:click={() => dispatch('toggleTheme')}
    >
      {#if theme === 'dark'}
        <Sun size={17} />
      {:else}
        <Moon size={17} />
      {/if}
    </button>

    <button
      class={`grid size-9 place-items-center rounded-full border transition ${buttonTheme}`}
      aria-label="编辑词库"
      type="button"
      data-guide="edit-button"
      on:click={() => dispatch('edit')}
    >
      <Pencil size={17} />
    </button>
  </div>
</header>
