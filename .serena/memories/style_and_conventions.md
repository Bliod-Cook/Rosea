TypeScript/React:
- 2-space indent, camelCase for vars/functions, PascalCase for components
- Named exports preferred
- Follow eslint.config.js; keep diffs minimal and focused
- Avoid frequent React state updates in hot paths (use refs for canvas)

Rust:
- rustfmt defaults; snake_case for functions/modules; PascalCase types
- Keep warnings zero (clippy -D warnings)

General:
- Update CHANGELOG.md for user-facing changes; Conventional Commits
- Avoid committing secrets; use config.yaml or env vars
