# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript app.
  - `src/common/`: components, hooks, services, utilities
  - `src/store/`: Redux Toolkit slices, selectors, typed hooks
  - `src/shared/`: shared types
  - `src/lib/`: device sketches (e.g., `OLED_*.ino`)
- `src-tauri/`: Tauri (Rust) desktop wrapper (`main.rs`, `tauri.conf.json`).
- `public/`: static assets. `dist/`: production build output.
- `data/`: runtime measurement data (created on demand).
- Docs: `README.md`, `ARCHITECTURE.md`, `DEPLOY.md`.

## Build, Test, and Development Commands
- `pnpm i`: install dependencies (pnpm required).
- `pnpm dev`: run Vite dev server for the web app.
- `pnpm tauri:dev`: run desktop app (Vite + Tauri).
- `pnpm build`: type-check and build to `dist/`.
- `pnpm preview`: serve the built app locally.
- `pnpm lint`: run ESLint across the repo.
- `pnpm tauri:build`: build desktop binaries (Rust toolchain required).

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Indentation: 2 spaces.
- Components: PascalCase (e.g., `TimeHistogram.tsx`). Hooks: `useX` camelCase.
- Redux: slices in `src/store/slices/*Slice.ts`; selectors in `src/store/selectors/`.
- Prefer function components + hooks; avoid class components.
- Linting: `eslint.config.js` with React Hooks rules. Run `pnpm lint` before PRs.

## Testing Guidelines
- Current: No formal tests checked in. Prefer Vitest + React Testing Library.
- Naming: colocate `*.test.ts(x)` next to source or under `__tests__/`.
- Cover reducers, selectors, and critical components minimally.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`). Keep messages imperative and scoped.
- PRs: include purpose, concise summary, screenshots for UI changes, and linked issues.
- Checks: ensure `pnpm build` and `pnpm lint` pass before requesting review.

## Security & Configuration Tips
- Validate inputs for Web Serial/Tauri FS; handle permission errors gracefully.
- Review `src-tauri/tauri.conf.json` capability changes.
- Do not commit `data/` contents (may contain user measurements).
