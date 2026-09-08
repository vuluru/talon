# AUR Packaging for Talon

This directory contains AUR (Arch User Repository) packaging files for Talon.

## Package: talon-bin (Recommended)

**Location**: `talon-bin/`

Binary distribution package that does NOT require a Rust toolchain. This is the recommended installation method for end users.

### Files
- `PKGBUILD` - Package build script for binary distribution
- `talon.desktop` - XDG desktop entry
- `talon.png` - Application icon

### Installation
```bash
# Clone the AUR package (when published)
git clone https://aur.archlinux.org/talon-bin.git
cd talon-bin

# Build and install
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
- **Package name**: `talon` (AUR: `talon-bin`)
- **Binary**: `/usr/bin/talon`
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
- `libayatana-appindicator` - System tray support

No Rust toolchain or build dependencies required for the binary package.

## Release Workflow

To publish a new release:

1. **Create GitHub Release**:
   - Tag version (e.g., `v0.1.0`)
   - Build Linux binary: `npm run tauri build`
   - Package as tarball: `tar czf talon-0.1.0-linux-x86_64.tar.gz -C src-tauri/target/release talon`
   - Upload to GitHub Releases

2. **Update PKGBUILD**:
   - Update `pkgver` to match release version
   - Update `sha256sums` with checksums from release artifacts
   - Test build with `makepkg -si`

3. **Publish to AUR**:
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

- The binary package (`talon-bin`) is the primary/recommended distribution method
- Source URL pattern is prepared for GitHub releases (placeholder until first release is cut)
- The Tauri binary is currently named `talon-app` in Cargo.toml but will be renamed to `talon` during build/packaging
- No second binary, no separate opener application
