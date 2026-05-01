# YakYak / 说词儿啊！

YakYak（中文名：说词儿啊！）是一个给直播主播使用的手机优先提示工具。它帮助主播盯住说话节奏，在快冷场时给出万能句，并用流程词列表推进本轮直播内容。

> English: YakYak is a mobile-first prompting tool for livestream hosts. It keeps a visible speaking cadence timer, surfaces fallback phrases when silence gets risky, and tracks flow prompts that can be marked as completed with a swipe.

## 功能

- 可循环的说话倒计时，默认 8 秒，也可以自定义秒数。
- 倒计时进入最后三分之一时，随机显示一句万能句。
- 流程词列表支持左右滑动标记“已完成”。
- 编辑词库里可以新增、删除、排序流程词和万能句。
- 数据保存在浏览器 IndexedDB 中。
- 支持 JSON 导入 / 导出词库，导入前会显示预览确认。
- 支持 light / dark 模式。
- 支持 PWA，可添加到手机主屏幕。
- 手机窄屏优先，没有页面级滚动，流程词区域内部滚动。
- 内置使用引导和系统弹窗。

## 适合谁

适合需要持续输出、避免冷场、按流程推进内容的主播。比如：

- 直播带货
- 游戏 / 娱乐直播
- 知识讲解
- 线上活动主持
- 需要固定话术节奏的直播场景

## 技术栈

- Svelte 5
- Vite
- TypeScript
- Tailwind CSS
- pnpm
- driver.js
- svelte-dnd-action
- svelte-sonner

## 本地开发

```bash
corepack pnpm install
corepack pnpm dev
```

## 检查和构建

```bash
corepack pnpm check
corepack pnpm build
```

## E2E 测试

Python E2E 测试位于 `etest/`，使用 Playwright 跑生产预览构建。

```bash
pip install playwright
playwright install chromium
python -m unittest etest/test_yakyak.py
```

## Base URL

默认构建使用相对资源路径，因此同一份构建可以同时适配自定义域名根路径和 GitHub Project Pages 子路径。

如需强制指定 base URL：

```bash
YAKYAK_BASE_URL=/YakYak/ corepack pnpm build
YAKYAK_BASE_URL=https://yakyak.w0fv1.dev/ corepack pnpm build
```

## 部署

线上地址：

```text
https://yakyak.w0fv1.dev/
```

GitHub Project Pages 地址：

```text
https://w0fv1.github.io/YakYak/
```

`public/CNAME` 已配置自定义域名：

```text
yakyak.w0fv1.dev
```

每次推送到 `main` 都会触发 `.github/workflows/deploy-pages.yml`，构建应用并把 `dist/` 发布到 `pages` 分支。

## English

YakYak is a mobile-first prompting tool for livestream hosts.

It helps hosts:

- keep a minimum speaking cadence with a looping countdown timer;
- get fallback phrases when silence becomes risky;
- follow a prepared flow of prompts during a live session;
- swipe completed flow prompts out of the current round;
- edit, import, and export phrase libraries;
- install the tool as a PWA on mobile devices.

### Development

```bash
corepack pnpm install
corepack pnpm dev
```

### Checks

```bash
corepack pnpm check
corepack pnpm build
```

### E2E

```bash
pip install playwright
playwright install chromium
python -m unittest etest/test_yakyak.py
```

## License

MIT
