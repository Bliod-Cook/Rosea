Dev & Run:
- pnpm dev            # Run Tauri app with Vite dev server
- pnpm web:dev        # Frontend only dev
- pnpm web:build      # Build frontend to dist/
- pnpm build          # Build desktop app via Tauri
- pnpm preview        # Serve dist/

Lint & QA:
- pnpm lint           # ESLint for TS/TSX
- (Rust) from src-tauri/: cargo fmt --all; cargo clippy -- -D warnings; cargo build; cargo test

Useful:
- rg "pattern" -n     # fast code search
- cargo build         # backend build

Entrypoints:
- Frontend: src/main.tsx
- Canvas overlay: src/canvas/main.tsx -> src/canvas/canvas.tsx
- Tauri backend: src-tauri/src/main.rs
