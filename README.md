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
- PWA support for adding YakYak to the home screen.
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

## E2E Tests

Python E2E tests live in `etest/` and use Playwright against the production preview build.

```bash
pip install playwright
playwright install chromium
python -m unittest etest/test_yakyak.py
```

## Base URL

The Vite build uses relative asset paths by default, so the same build works from both a custom domain root and GitHub Project Pages.

To force a specific base URL:

```bash
YAKYAK_BASE_URL=/YakYak/ corepack pnpm build
YAKYAK_BASE_URL=https://yakyak.w0fv1.dev/ corepack pnpm build
```

## GitHub Pages

The production build is configured for GitHub Project Pages at:

```text
https://w0fv1.github.io/YakYak/
```

The Pages build also includes `public/CNAME` for:

```text
https://yakyak.w0fv1.dev/
```

Every push to `main` runs `.github/workflows/deploy-pages.yml`, builds the app, and publishes `dist/` to the `pages` branch.

## License

MIT
