# Linux Tarball Packaging

This directory documents the Linux tarball release format for GitHub Releases.

## Tarball Contents

Release tarballs should include:
- `talon` - Binary executable
- `talon.desktop` - XDG desktop entry
- `talon.png` - Application icon (48x48 or larger)

## Building a Release Tarball

```bash
# Build the binary
npm run tauri build

# Package with desktop integration files
mkdir -p talon-pkg
cp src-tauri/target/release/talon talon-pkg/
cp packaging/aur/talon-bin/talon.desktop talon-pkg/
cp packaging/aur/talon-bin/talon.png talon-pkg/

# Create tarball
VERSION="0.1.0"  # Update for each release
tar czf talon-${VERSION}-linux-x86_64.tar.gz -C talon-pkg .

# Generate checksum
sha256sum talon-${VERSION}-linux-x86_64.tar.gz
```

## User Installation

Users extract the tarball and install:

```bash
# Extract
tar xzf talon-VERSION-linux-x86_64.tar.gz

# Install binary
sudo install -Dm755 talon /usr/local/bin/talon

# Install desktop entry (optional, for application menu)
sudo install -Dm644 talon.desktop /usr/share/applications/talon.desktop

# Install icon (optional, for application menu)
sudo install -Dm644 talon.png /usr/share/pixmaps/talon.png
```

## XDG Paths

Standard installation paths for desktop integration:
- Binary: `/usr/local/bin/talon` (or `/usr/bin/talon` for system packages)
- Desktop entry: `/usr/share/applications/talon.desktop`
- Icon: `/usr/share/pixmaps/talon.png` (or `/usr/share/icons/hicolor/48x48/apps/talon.png`)

## Notes

- The desktop file references `Icon=talon`, which resolves from `/usr/share/pixmaps/talon.png`
- Users can install to `~/.local/bin` and `~/.local/share` for single-user installs
- Future enhancement: Add a simple `install.sh` script to automate installation
