# AUR Packaging for Talon

This directory contains AUR (Arch User Repository) packaging files for Talon.

## Package: talon

**AUR package name**: `talon` (searchable as `talon` on AUR)  
**Repo directory**: `talon-bin/` (binary-style PKGBUILD layout in this repo)

Binary distribution package that does NOT require a Rust toolchain. This is the recommended installation method for end users.

### Files
- `PKGBUILD` - Package build script for binary distribution
- `talon.desktop` - XDG desktop entry
- `talon.png` - Application icon

### Installation
```bash
# AUR helper (e.g. yay, paru) — package name is talon
yay -S talon

# Or manually (when published to AUR as talon)
git clone https://aur.archlinux.org/talon.git
cd talon
makepkg -si
```

### Post-Install
After installation:
- Binary: `/usr/bin/talon`
- Desktop entry: Available in application menu as "Talon"
- Launch: Run `talon` from terminal or application menu
- The application will launch using your existing Tauri app (no new Chrome instance)

## Package Details

### Naming
- **AUR package name / search**: `talon`
- **Repo packaging path**: `packaging/aur/talon-bin/` (binary-style layout)
- **Binary**: `/usr/bin/talon` (via Cargo.toml `[[bin]] name = "talon"`)
- **Desktop Name**: Talon
- **Icon**: talon (installed to `/usr/share/pixmaps/talon.png`)

### Desktop Integration
- **Categories**: Office, TextEditor
- **Terminal**: No (GUI application)
- **StartupWMClass**: Talon (matches Tauri window class)

### Dependencies
The package depends on:
- `webkit2gtk-4.1` - WebKit rendering engine
- `gtk3` - GTK+ 3 toolkit
- `cairo` - 2D graphics library

No Rust toolchain or build dependencies required for the binary package.

## Release Workflow

To publish a new release:

1. **Create GitHub Release**:
   - Tag version (e.g., `v0.1.0`)
   - Build Linux binary: `npm run tauri build`
   - Package as tarball including desktop entry and icon:
     ```bash
     mkdir -p talon-pkg
     cp src-tauri/target/release/talon talon-pkg/
     cp packaging/aur/talon-bin/talon.desktop talon-pkg/
     cp packaging/aur/talon-bin/talon.png talon-pkg/
     tar czf talon-0.1.0-linux-x86_64.tar.gz -C talon-pkg .
     ```
   - Generate checksums: `sha256sum talon-0.1.0-linux-x86_64.tar.gz`
   - Upload tarball to GitHub Releases with checksum in release notes

2. **Update PKGBUILD**:
   - Update `pkgver` to match release version
   - Update `sha256sums` with checksums from release artifacts
   - Test build with `makepkg -si`

3. **Publish to AUR** (when registration reopens):
   - Update `.SRCINFO`: `makepkg --printsrcinfo > .SRCINFO`
   - Commit and push to AUR repository

## ADR-004 Compliance

This packaging implementation satisfies ADR-004 requirements:
- ✓ Package name: `talon`
- ✓ Single binary: `/usr/bin/talon`
- ✓ Desktop file with Name=Talon, Exec=talon, Icon=talon
- ✓ Categories: Office;TextEditor;
- ✓ Terminal=false
- ✓ Prebuilt binary (no Rust toolchain required)
- ✓ No opener revival (uses Tauri's built-in dialog/fs only)
- ✓ Ships .desktop + icon with package
- ✓ Official Omarchy Package Repository = OOS (out of scope)

## Notes

- **AUR search name**: `talon` (deferred until registration reopens)
- **Repo directory**: `talon-bin/` is the local packaging path (binary-style PKGBUILD)
- Source URL pattern points to GitHub releases (v0.1.0 published with real checksums)
- Binary name is `talon` via Cargo.toml `[[bin]] name = "talon"` — installs to `/usr/bin/talon`
- No second binary, no separate opener application
- PKGBUILD includes verified sha256sums from v0.1.0 release
