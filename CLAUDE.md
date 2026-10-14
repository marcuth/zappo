# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

| Command             | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start Vite dev server (frontend only)                         |
| `npm run tauri dev` | Start Tauri app in development mode (frontend + Rust backend) |
| `npm run build`     | TypeScript compile + Vite build for production                |
| `npm run preview`   | Preview the production build locally                          |
| `npm run lint`      | Run ESLint to check for errors                                |
| `npm run format`    | Format code with Prettier                                     |
| `npm run ci`        | Run lint + format check (fails on issues)                     |

### Rust Backend

| Command                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `cd src-tauri && cargo test`      | Run Rust unit tests                              |
| `cd src-tauri && cargo tarpaulin` | Run coverage analysis (requires cargo-tarpaulin) |

**Note**: The Rust backend aims for 100% code coverage. Frontend testing framework is not yet configured.

### Tauri Build

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `npm run tauri build` | Build the Tauri desktop application for production |

## Code Architecture

### High-Level Structure

This is a **Tauri v2 desktop application** combining a React 19 frontend with a Rust backend. The architecture follows a provider-pattern with React contexts for state management.

```
src/                    # Frontend source (React + TypeScript)
├── components/         # UI components
│   ├── providers/      # React contexts (Account, Theme, Avatar)
│   └── ui/             # Base UI components (shadcn/ui)
├── services/           # API calls and business logic
│   └── whatsapp-service.ts  # WhatsApp client integration
├── schemas/            # Zod validation schemas
├── types/              # Global TypeScript types
├── App.tsx            # Root component
└── main.tsx           # Entry point

src-tauri/             # Rust backend
├── src/               # Rust source files
│   ├── main.rs        # Tauri entry point
│   ├── lib.rs         # Module exports and app setup
│   ├── commands.rs    # Tauri command handlers
│   ├── models.rs      # Data models
│   ├── session_manager.rs  # Session management (multi-account)
│   └── storage.rs     # SQLite storage management
├── Cargo.toml         # Rust dependencies
└── tauri.conf.json    # Tauri configuration
```

### Key Patterns

- **React Contexts**: Account state, theme, and avatar images are managed via providers (`AccountProvider`, `ThemeProvider`, `AvatarProvider`) placed in `src/main.tsx`
- **shadcn/ui**: Base UI components are in `src/components/ui/`. New components should be added via `npx shadcn@latest add <component>` — do not manually copy from other projects.
- **Tailwind CSS 4**: Utility classes throughout; keep custom CSS in component files or `App.css`.
- **Zod v4**: Runtime validation for external data (API responses, form inputs). Schemas live in `src/schemas/`.
- **Rust Backend**: Tauri v2 with `whatsapp-rust` crate for WhatsApp protocol. Commands are defined in `src-tauri/src/commands.rs` and exposed via `tauri::generate_handler!`.
- **Multi-account Support**: Rust `SessionManager` handles multiple WhatsApp accounts with isolated SQLite storage.

### Important Files

- `src/App.tsx` — Root React component, wires providers and modals
- `src/main.tsx` — Entry point, composes providers (AccountProvider → AvatarProvider → MainApp)
- `src/components/providers/account-provider.tsx` — Account context with `useAccount` hook
- `src/components/providers/theme-provider.tsx` — Theme context (dark/light/system)
- `src/components/providers/avatar-provider.tsx` — Avatar/image provider
- `src-tauri/src/lib.rs` — Rust app setup, session management
- `src-tauri/src/commands.rs` — All Tauri command handlers
- `src-tauri/Cargo.toml` — Rust dependencies (includes `whatsapp-rust`, `rusqlite`)

## Development Workflow

1. **Start development**: `npm run tauri dev` — launches Vite HMR + Tauri app with Rust backend
2. **Edit React/TypeScript files** in `src/` — changes hot-reload in the Tauri window
3. **Edit Rust code** in `src-tauri/src/` — rebuilds automatically via Tauri dev mode
4. **Format and lint**: `npm run format && npm run lint` before committing
5. **Build for production**: `npm run build && npm run tauri build`

## Conventions from AGENTS.md

- **Indentation**: 4 spaces
- **Quotes**: Double (`"`)
- **Trailing commas**: All (multi-line)
- **Import sorting**: By length descending via `@trivago/prettier-plugin-sort-imports`
- **TypeScript**: Strict mode — avoid `any`, use `unknown` when type is uncertain
- **Naming**: kebab-case for files, PascalCase for components/interfaces, camelCase for functions/variables, SCREAMING_SNAKE_CASE for constants
- **React**: Functional components with hooks; `useCallback`/`useMemo` only when there's measurable benefit
- **Error Handling**: Zod for runtime validation, try/catch for async ops, user-friendly error messages
- **Icons**: `react-icons/lu` (Lucide), e.g., `import { LuUser, LuSettings } from "react-icons/lu"`
- **Pre-commit**: Run `npm run format` and `npm run lint` before committing
