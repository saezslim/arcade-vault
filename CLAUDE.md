# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score. The project follows Spec Driven Development (`/spec` and `/spec-impl`), using skills from https://github.com/Klerith/fernando-skills (installed with `npx skills@latest add Klerith/fernando-skills`). The README is in Spanish.

Currently the app is a fresh Create Next App scaffold (`app/` only has `layout.tsx`, `page.tsx`, `globals.css`). `references/templates/` holds an HTML/JSX design prototype (`Arcade Vault.html`, plus `auth`, `biblioteca`, `detalle`, `reproductor`, `salon`, `nav`, `data`, `app` `.jsx` and `styles.css`) that is the visual/UX reference for the screens to build: auth, game library, game detail, player, leaderboard ("salón"). It is reference material, not part of the Next.js build.

## Commands

Package manager is **pnpm** (`pnpm@11.22.0`).

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`)

No test runner is configured.

## Next.js notes

- `AGENTS.md` warns this Next.js (16.4.2, React 19.3) has breaking changes versus training data; read the guides in `node_modules/next/dist/docs/` before writing code. (That folder was not present at the last check — verify after `pnpm install`.)
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`, so caching/prefetch behavior follows the Cache Components model, not the older default caching.
- Tailwind v4 is wired through Turbopack (`@tailwindcss/turbopack` rule for `*.css` in `next.config.ts`), with theme tokens in `app/globals.css` via `@theme inline`.
- The root layout types props with the global `LayoutProps<"/">` helper (typed routes), not a hand-written props type.
- Path alias: `@/*` maps to the repo root.
