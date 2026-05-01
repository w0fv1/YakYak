# YakYak

YakYak is a mobile-first prompting tool for livestream hosts. It keeps a visible speaking cadence timer, surfaces fallback phrases when silence gets risky, and tracks a round of flow prompts that can be marked as completed with a swipe.

中文名：说词儿啊！

## Features

- Looping countdown timer with configurable cadence.
- Random fallback phrases during the final third of the timer.
- Flow prompt list with swipe-to-complete round state.
- Light and dark modes.
- IndexedDB persistence in the browser.
- JSON import and export for phrase libraries.
- Mobile-first layout with no page-level scrolling.

## Tech Stack

- Svelte 5
- Vite
- TypeScript
- Tailwind CSS
- pnpm

## Development

```bash
corepack pnpm install
corepack pnpm dev
```

## Checks

```bash
corepack pnpm check
corepack pnpm build
```

## GitHub Pages

The production build is configured for GitHub Project Pages at:

```text
https://w0fv1.github.io/YakYak/
```

Every push to `main` runs `.github/workflows/deploy-pages.yml`, builds the app, and publishes `dist/` to the `pages` branch.

## License

MIT
