# Repository Guidelines

## Project Structure & Module Organization
- React + TypeScript via Vite; extension entry `src/main.tsx`, UI root `src/App.tsx`.
- UI pieces in `src/components/` (Background, SearchBar, BookmarkGrid, drawers, etc.) with barrel export `src/components/index.ts`; shared hooks in `src/hooks/`, state in `src/stores/` (Zustand), utilities in `src/utils/`, i18n in `src/i18n/`, styles in `src/styles/`.
- `src/background.ts` hosts the extension service worker; assets in `src/assets/`; static manifest/icons/screenshots live in `public/`; build artifacts output to `dist/` with the manifest copied post-build.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start the Vite dev server; use with the extension reloader or open http://localhost:5173 for UI checks.
- `npm run dev:watch` — watch builds for extension workflows that need continuous bundling.
- `npm run build` — type-check (`tsc -b`), bundle with Vite, and copy `public/manifest.json` & icons into `dist/`.
- `npm run preview` — serve the production bundle locally.
- `npm run lint` — run ESLint across the repo.

## Coding Style & Naming Conventions
- TypeScript strict mode; prefer functional React components and hooks; state lives in Zustand slices under `src/stores`.
- CSS Modules per component; keep shared globals in `src/styles/globals.css`.
- Use 2-space indentation, semicolons, single quotes; PascalCase for components/types, camelCase for functions/variables, SCREAMING_SNAKE_CASE for constants.
- Keep exports centralized via existing barrel files when adding new modules.

## Testing Guidelines
- No automated test suite yet; at minimum run `npm run lint` and `npm run build` before PRs.
- When adding logic-heavy utilities or hooks, co-locate tests as `*.test.ts(x)` and prefer React Testing Library + Vitest to match Vite.
- Provide manual QA notes (browsers, extension steps, screenshots) in PRs.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`) as seen in history; keep messages imperative and scoped.
- PRs should include a brief summary, linked issues, screenshots/GIFs for UI changes (light/dark where relevant), and test/QA notes.
- Keep changes small and focused; update related docs/strings in `src/i18n/` when altering user-facing text.

## Security & Configuration Tips
- Update extension metadata in `public/manifest.json`; request only necessary permissions.
- Do not embed secrets or analytics keys; data is stored locally (check storage helpers in `src/utils/` and stores).
- After `npm run build`, load `dist/` via `chrome://extensions` → "Load unpacked" to validate permissions and background behavior.
