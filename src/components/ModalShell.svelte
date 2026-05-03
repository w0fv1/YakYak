<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { X } from 'lucide-svelte'

  interface $$Slots {
    default: {}
  }

  type VisualTheme = 'dark' | 'light'

  export let theme: VisualTheme
  export let title: string
  export let description = ''
  export let labelledBy: string
  export let maxWidth = 'sm:max-w-sm'
  export let zIndex = 'z-40'
  export let panelClass = ''
  export let contentClass = 'p-4'

  const dispatch = createEventDispatcher<{
    close: void
  }>()
</script>

<div class={`fixed inset-0 ${zIndex} flex items-end p-3 sm:items-center sm:justify-center`}>
  <button
    class="absolute inset-0 bg-black/60 backdrop-blur-md"
    type="button"
    aria-label={`关闭${title}`}
    on:click={() => dispatch('close')}
    transition:fade={{ duration: 160 }}
  ></button>
  <div
    class="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.14),transparent_34%),linear-gradient(225deg,rgba(6,182,212,0.12),transparent_38%),linear-gradient(180deg,transparent,rgba(255,255,255,0.04))]"
    transition:fade={{ duration: 220 }}
  ></div>
  <div
    class={`relative w-full rounded-xl border shadow-2xl will-change-[transform,opacity] ${maxWidth} ${
      theme === 'dark' ? 'border-white/10 bg-zinc-950 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-950'
    } ${panelClass}`}
    role="dialog"
    aria-modal="true"
    aria-labelledby={labelledBy}
    in:fly={{ y: 22, duration: 180 }}
    out:fly={{ y: 14, duration: 120 }}
  >
    <div class={contentClass}>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 id={labelledBy} class="text-lg font-black tracking-normal">{title}</h2>
          {#if description}
            <p class="mt-1 text-xs text-zinc-500">{description}</p>
          {/if}
        </div>
        <button
          class="grid size-9 place-items-center rounded-full"
          type="button"
          aria-label="关闭"
          on:click={() => dispatch('close')}
        >
          <X size={18} />
        </button>
      </div>

      <slot />
    </div>
  </div>
</div>
