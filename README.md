# Talon

An Omarchy / Arch-friendly AI-centric Markdown word processor.  
**Thin chrome, Markdown-honest source editing** — no WYSIWYG bloat.  
Install from [GitHub Releases](#installation) (Linux x86_64 tarball available now).  
AUR package **`talon`** will be available when AUR registration reopens (not yet live).

## Architecture

- **Core**: Tauri 2 (Rust backend, web frontend)
- **Frontend**: Vite + TypeScript
- **Editor**: CodeMirror 6 (Markdown source editing)
- **Preview**: marked (optional Markdown preview)

## Features (v0 dogfood spike)

### Chrome (Thin + Sparse)
- Thin title bar (file name only)
- Sparse footer (path · word count)
- NO toolbar / ribbon / sidebar / chat
- Edit-first: Markdown source is truth
- Optional preview pane (hide with ⌘\)

### File Operations
- Open, Save, Save As file operations
- Dirty state tracking (• indicator)
- Markdown source editing (CodeMirror 6)

### AI Integration (ADR-003)
- BYO API key (stored locally)
- **⌘J / Ctrl+J** to summon AI (ephemeral card, not docked)
- Empty selection → **whole document** + visible **scope chip**
- Selection present → processes selection only, Apply replaces in place
- **Actions**:
  - **Rewrite for clarity** (default, primary)
  - **More** control: Shorten / Outline / Extract → `## Decisions`
- **Apply (⏎)** / **Dismiss (Esc)** workflow
- Single suggestion only (no carousel, no chat thread)
- Never auto-apply
- Mock responses available without API key
- Missing key → soft Settings hint (not dead end)
- Extract always appends to end of document

### Settings (BYO)
- **Provider selection**: OpenAI / Anthropic / xAI
- API key input
- **"Stored only on this device"** (exact copy)
- ⌘, opens Settings
- Esc back to write
- No account wall

### Keyboard Shortcuts (Locked)
- **⌘J** / **Ctrl+J**: Summon AI (ephemeral card)
- **⏎**: Apply AI suggestion (when card visible)
- **Esc**: Dismiss AI card
- **⌘\\** / **Ctrl+\\**: Toggle preview
- **⌘,** / **Ctrl+,**: Settings
- **⌘N** / **Ctrl+N**: New file
- **⌘O** / **Ctrl+O**: Open file
- **⌘S** / **Ctrl+S**: Save
- **⌘⇧S** / **Ctrl+Shift+S**: Save As

## Development

### Prerequisites
- Node.js 18+ and npm
- **Rust 1.85+ and Cargo** (Tauri 2 requirement)
- Platform-specific dependencies:
  - **Linux**: `webkit2gtk-4.1` and `librsvg2` (Arch: `webkit2gtk-4.1 librsvg`; Debian/Ubuntu: `libwebkit2gtk-4.1-dev librsvg2-dev`)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
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

**Linux / macOS:**
```bash
npm run tauri dev
```

**Windows:**
```bash
npm run tauri dev
```

The app will open with hot-reload enabled. Changes to frontend code will auto-refresh.

### Build for Production

**Linux / macOS / Windows:**
```bash
npm run tauri build
```

Linux produces AppImage and .deb; macOS produces .app and .dmg; Windows produces .msi and .exe.

## Installation

### Linux (x86_64)

Download the latest release from [GitHub Releases](https://github.com/vuluru/talon/releases):

```bash
# Download v0.1.2 tarball (check Releases page for newer versions)
curl -LO https://github.com/vuluru/talon/releases/download/v0.1.2/talon-0.1.2-linux-x86_64.tar.gz

# Verify checksum (use sha256 from Release notes for newer versions)
echo "d5892b558d20d93ce5470fdca71d64b4bd88a02d579eb6a470b802e985375d24  talon-0.1.2-linux-x86_64.tar.gz" | sha256sum -c

# Extract
tar xzf talon-0.1.2-linux-x86_64.tar.gz

# Install binary, desktop entry, and icon (requires sudo)
sudo install -Dm755 talon /usr/local/bin/talon
sudo install -Dm644 talon.desktop /usr/share/applications/talon.desktop
sudo install -Dm644 talon.png /usr/share/pixmaps/talon.png
```

After install: run `talon` from terminal, or launch **Talon** from your application menu.

### Arch Linux (AUR)

AUR package **`talon`** is deferred until AUR package registration reopens. When available, install via:

```bash
yay -S talon
```

See `packaging/aur/README.md` for packaging details.

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
Set your AI provider API key in Settings (⌘, / Ctrl+,). Choose from:
- **OpenAI** (gpt-3.5-turbo)
- **Anthropic** (claude-3-sonnet)
- **xAI** (grok-4.6)

The key is "Stored only on this device" (browser localStorage) and never leaves your machine.

## Design Constraints (ADR-001)

- Tauri-based (not Electron, not native-only)
- **Not WYSIWYG** — Markdown-honest source editing
- AI must never block typing
- Fast cold start (lean dependencies, minimal boot work)
- **Thin chrome budget** — title + editor + sparse footer (no toolbar/ribbon/sidebar/chat)

## Editor Library Decision (ADR-002 proposal)

**CodeMirror 6** was chosen for:
- Markdown-honest source editing (not WYSIWYG)
- Fast performance and small bundle size
- Extensible architecture
- Strong TypeScript support

TipTap and Lexical were considered but lean toward WYSIWYG/prose editing, which conflicts with ADR-001.

No further Design pixels to wait on. Ready for dogfooding.

## Design Pack (PM-Accepted for v0)

The Design UX pack from Talon Design is **PM-accepted** and implemented. Not proposal — locked specification.

### Locked Elements
- **Keyboard**: ⌘J summon · ⏎ Apply · Esc Dismiss · ⌘\ toggle preview · ⌘, Settings (Ctrl on Win/Linux)
- **Foot strip**: On for v0 (path · word count)
- **Key storage**: Local device; UI copy "Stored only on this device" (mechanism: localStorage)
- **Chrome budget**: Thin title + sparse footer (no toolbar/ribbon/sidebar/chat)
- **AI card**: Ephemeral (near cursor), single suggestion, never auto-apply
- **Context (ADR-003)**: Selection → replace in place; No selection → **whole document + scope chip**
- **More control**: Shorten / Outline / Extract behind one More button (not carousel)

No further Design pixels to wait on. Ready for dogfooding.

## AI Scope Behavior (ADR-003 Tightened)

- **Empty selection**: Whole document + visible scope chip
- **Selection present**: Selection-only mode, Apply replaces selection in place
- **Ephemeral card**: Floats near cursor (not docked footer)
- **Single suggestion**: No carousel, no chat thread, never auto-apply
- **More control**: Secondary actions (Shorten / Outline / Extract) behind one More button

## License

Proprietary — Jason Hu is HIL for all merges.
