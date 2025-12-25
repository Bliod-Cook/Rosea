# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript UI (e.g., `canvas/`, `menu/`, `randomer/`), entry `main.tsx`, `index.html`, styles and assets under `assets/`.
- `src-tauri/`: Tauri (Rust) backend — `src/main.rs`, `src/lib.rs`, Cargo project and `tauri.conf.json`.
- `public/`: static assets; `dist/`: Vite build output consumed by Tauri.
- `.github/workflows/`: CI for build/release; `scripts/`: release helpers (`changelog.mjs`).
- `CHANGELOG.md`: release notes (sections like `## 0.4.2` separated by `---`).

## Build, Test, and Development Commands
- Prereqs: Node 22 + pnpm, Rust 1.83+.
- `pnpm dev`: Run Tauri app with Vite dev server.
- `pnpm web:dev` / `pnpm web:build`: Frontend only dev/build to `dist/`.
- `pnpm build`: Build desktop app via Tauri; `pnpm preview`: Serve `dist/`.
- `pnpm lint`: ESLint for TS/TSX.
- Rust (from `src-tauri/`): `cargo fmt --all`, `cargo clippy -- -D warnings`, `cargo build`.

## Coding Style & Naming Conventions
- TypeScript/React: follow `eslint.config.js`; prefer 2‑space indent, PascalCase components, camelCase variables/functions, named exports for modules.
- Rust: rustfmt defaults; `snake_case` for functions/modules, `PascalCase` for types.
- Keep UI pages in feature folders (e.g., `src/randomer/`, `src/menu/`).

## Testing Guidelines
- No formal suites yet. If adding logic, include tests:
  - Rust: `#[cfg(test)]` modules under `src-tauri/src`, run `cargo test`.
  - Web: if introducing a test runner (e.g., Vitest), place `*.test.ts(x)` beside sources.
- For UI changes, include manual verification steps in PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`). Keep subjects ≤72 chars.
- PRs: clear description, linked issues, screenshots/GIFs for UI, and steps to reproduce/verify.
- Update `CHANGELOG.md` for user‑facing changes.

## Release & Versioning
- Bump `version` in `src-tauri/tauri.conf.json` and add a matching `## x.y.z` section in `CHANGELOG.md`.
- Tag releases `app-vx.y.z` to trigger `.github/workflows/publish`.
- Updater keys/endpoints are maintained via CI secrets; do not commit secrets.

