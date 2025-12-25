Project: rosea
Purpose: Tauri (Rust) + React/TS desktop app with a canvas overlay window and UI modules (menu, randomer, settings, update). The canvas supports pen/eraser drawing and integrates with Tauri window management.
Tech stack: React + TypeScript (Vite), Tauri (Rust, WebView2/Chromium), pnpm for JS, Cargo for Rust.
Structure: 
- src/: UI (main.tsx entry, canvas/, menu/, settings/)
- src/canvas/: canvas entry + drawing logic (canvas.tsx)
- src-tauri/: Tauri backend (main.rs, lib.rs, tauri.conf.json)
- public/: static assets
- scripts/: release helpers
- .github/workflows/: CI for build/release
Notes: Drawing performance critical; uses 2D canvas with desynchronized context and coalesced pointer events.
Environment: Windows host (WSL possible). Use Windows paths for MCP tools if absolute path is required.
