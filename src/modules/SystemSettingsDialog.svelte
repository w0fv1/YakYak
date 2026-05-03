<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { HelpCircle, Maximize2, Minimize2, RefreshCcw, Smartphone } from 'lucide-svelte'
  import ActionRow from '../components/ActionRow.svelte'
  import ModalShell from '../components/ModalShell.svelte'
  import type { ThemeMode } from '../services/types'

  export let theme: ThemeMode
  export let canInstallPwa = false
  export let isFullscreen = false

  const dispatch = createEventDispatcher<{
    close: void
    install: void
    fullscreen: void
    guide: void
    restoreDefaults: void
  }>()
</script>

<ModalShell
  {theme}
  title="系统"
  description="安装和使用帮助"
  labelledBy="system-title"
  on:close={() => dispatch('close')}
>
  <div class="grid gap-2">
    <ActionRow
      {theme}
      title="添加到主屏幕"
      description={canInstallPwa ? '点击发起添加；失败时先开启桌面快捷方式权限' : '浏览器菜单添加；小米/MIUI 需开启桌面快捷方式权限'}
      tone="cyan"
      on:click={() => dispatch('install')}
    >
      <Smartphone slot="icon" size={18} />
    </ActionRow>

    <div
      class={`rounded-lg border px-4 py-3 text-xs font-semibold leading-relaxed ${
        theme === 'dark'
          ? 'border-white/10 bg-white/[0.035] text-zinc-400'
          : 'border-zinc-200 bg-zinc-50 text-zinc-600'
      }`}
    >
      小米/MIUI 如果添加失败，请到系统设置里给当前浏览器开启“创建桌面快捷方式”或“桌面快捷方式”权限。网页无法可靠读取手机桌面图标，这里不会判断“已添加”，每次都会尽量重新发起添加或提示从浏览器菜单添加。
    </div>

    <ActionRow
      {theme}
      title={isFullscreen ? '退出全屏' : '进入全屏'}
      description={isFullscreen ? '恢复浏览器界面' : '隐藏浏览器界面，专注看词'}
      tone="violet"
      on:click={() => dispatch('fullscreen')}
    >
      {#if isFullscreen}
        <Minimize2 slot="icon" size={18} />
      {:else}
        <Maximize2 slot="icon" size={18} />
      {/if}
    </ActionRow>

    <ActionRow
      {theme}
      title="引导 / 帮助"
      description="重新查看 YakYak 的使用方式"
      tone="emerald"
      on:click={() => dispatch('guide')}
    >
      <HelpCircle slot="icon" size={18} />
    </ActionRow>

    <ActionRow
      {theme}
      title="恢复默认"
      description="重置倒计时、主题、流程词和万能句"
      tone="rose"
      on:click={() => dispatch('restoreDefaults')}
    >
      <RefreshCcw slot="icon" size={18} />
    </ActionRow>
  </div>
</ModalShell>
