<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  interface $$Slots {
    default: {}
    icon: {}
  }

  type VisualTheme = 'dark' | 'light'

  export let theme: VisualTheme
  export let title: string
  export let description: string
  export let tone: 'default' | 'cyan' | 'emerald' | 'violet' | 'rose' = 'default'

  const dispatch = createEventDispatcher<{
    click: void
  }>()

  $: iconClass =
    tone === 'rose'
      ? 'bg-rose-400 text-zinc-950'
      : tone === 'violet'
        ? 'bg-violet-400 text-zinc-950'
        : tone === 'emerald'
          ? 'bg-emerald-400 text-zinc-950'
          : 'bg-cyan-400 text-zinc-950'

  $: rowClass =
    tone === 'rose'
      ? theme === 'dark'
        ? 'border-rose-400/25 bg-rose-500/10 active:bg-rose-500/15'
        : 'border-rose-200 bg-rose-50 active:bg-rose-100'
      : theme === 'dark'
        ? 'border-white/10 bg-white/[0.06] active:bg-white/10'
        : 'border-zinc-200 bg-zinc-50 active:bg-zinc-100'
</script>

<button
  class={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${rowClass}`}
  type="button"
  on:click={() => dispatch('click')}
>
  <span class={`grid size-10 shrink-0 place-items-center rounded-full ${iconClass}`}>
    <slot name="icon" />
  </span>
  <span class="min-w-0">
    <span class="block text-sm font-black">{title}</span>
    <span class={`mt-1 block text-xs ${tone === 'rose' && theme === 'dark' ? 'text-rose-100/70' : tone === 'rose' ? 'text-rose-700' : 'text-zinc-500'}`}>
      {description}
    </span>
  </span>
</button>
