# Talon

An AI-centric Markdown word processor built with Tauri and web technologies.

## Architecture

- **Core**: Tauri 2 (Rust backend, web frontend)
- **Frontend**: Vite + TypeScript
- **Editor**: CodeMirror 6 (Markdown source editing)
- **Preview**: marked (optional Markdown preview)

## Features (v0 dogfood spike)

### Editor Core
- Open, Save, Save As file operations
- Autosave (configurable interval, default 30s)
- Recent files list
- Markdown source editing (CodeMirror 6)
- Optional preview pane (toggle or split, edit-first default)

### AI Integration
- BYO API key (stored locally, never committed)
- **⌘J / Ctrl+J** to summon AI
- Empty selection → processes whole document (with scope chip indicator)
- Selection present → processes only selection
- **Actions**:
  - **Rewrite** (primary): Improve clarity and style
  - **More** menu:
    - Shorten
    - Outline
    - Extract → `## Decisions`
- **Apply (⏎)** / **Dismiss (Esc)** workflow
- Mock responses available without API key

### Keyboard Shortcuts
- **⌘J** / **Ctrl+J**: Summon AI (primary action)
- **⏎**: Apply AI suggestion (when AI panel visible)
- **Esc**: Dismiss AI panel
- **⌘\\** / **Ctrl+\\**: Dismiss AI panel
- **⌘,** / **Ctrl+,**: Settings
- **⌘N** / **Ctrl+N**: New file
- **⌘O** / **Ctrl+O**: Open file
- **⌘S** / **Ctrl+S**: Save
- **⌘⇧S** / **Ctrl+Shift+S**: Save As
- **⌘P** / **Ctrl+P**: Toggle preview

## Development

### Prerequisites
- Node.js 18+ and npm
- **Rust 1.85+ and Cargo** (Tauri 2 requirement)
- Platform-specific dependencies:
  - **Linux**: `webkit2gtk` and `rsvg2` (see [Tauri prerequisites](https://tauri.app/guides/prerequisites/#linux))
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools

**Note**: If you have Rust 1.83 or earlier, you may encounter build errors. Update Rust with:
```bash
rustup update stable
```

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run tauri dev
```

The app will open with hot-reload enabled. Changes to frontend code will auto-refresh.

### Build for Production
```bash
npm run tauri build
```

## Project Structure

```
/
├── src/                    # Frontend TypeScript
│   ├── main.ts            # App entry point
│   ├── editor.ts          # CodeMirror editor
│   ├── fileManager.ts     # File operations
│   ├── preview.ts         # Markdown preview
│   ├── ai.ts              # AI service
│   ├── settings.ts        # Settings management
│   ├── recentFiles.ts     # Recent files tracking
│   └── styles.css         # Styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   └── lib.rs         # Tauri app setup
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── index.html             # HTML shell
├── package.json           # Node dependencies
└── README.md              # This file
```

## Configuration

### API Key
Set your OpenAI API key in Settings (⌘, / Ctrl+,). The key is stored in browser localStorage and never leaves your machine.

### Autosave Interval
Configure autosave interval (default 30 seconds) in Settings.

## Design Constraints (ADR-001)

- Tauri-based (not Electron, not native-only)
- **Not WYSIWYG** — Markdown-honest source editing
- AI must never block typing
- Fast cold start (lean dependencies, minimal boot work)

## Editor Library Decision (ADR-002 proposal)

**CodeMirror 6** was chosen for:
- Markdown-honest source editing (not WYSIWYG)
- Fast performance and small bundle size
- Extensible architecture
- Strong TypeScript support

TipTap and Lexical were considered but lean toward WYSIWYG/prose editing, which conflicts with ADR-001.

## AI Scope Behavior (ADR-003)

- **Empty selection**: Whole document mode with "Whole document" scope chip
- **Selection present**: Selection-only mode, Apply replaces selection
- Foot strip always visible when AI is active

## License

Proprietary — Jason Hu is HIL for all merges.
