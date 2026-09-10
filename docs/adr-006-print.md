# ADR-006: Print to OS / network printer

**Status:** Accepted / In progress  
**Date:** 2026-09-10  
**Owner:** Talon PM · **Implements:** Talon Build · **UX:** Talon Design  
**Related:** ADR-001 (thin chrome) · preview (`Ctrl+\`) · Shortcuts sheet

---

## Context

Jason wants to print from Talon to a **network printer**. v0.1.2 has no Print/PDF/export. Network discovery and driver stacks belong to the OS (CUPS on Omarchy), not Talon.

## Decision

Implemented **thin OS-print** path:

1. **`Ctrl+P` / ⌘P** opens the **system print dialog** on printable HTML derived from the current doc (prefer **preview** rendering, or a one-shot print stylesheet over the Markdown source view).
2. Network / local printers are chosen in the **OS dialog** — no in-app printer list, no Talon print server, no custom page-setup chrome beyond what the OS provides.
3. Optional later: “Save as PDF” only if it stays a single OS-dialog outcome (no export panel).

**Out:** cloud print services · in-app WYSIWYG page designer · print-preview chrome that duplicates the OS · silent/background printing without a dialog.

## Consequences

- Relies on Tauri/webview print (or equivalent) bridging to the OS dialog.
- Preview quality ≈ print quality; Markdown-honest source may need a print CSS so headings/lists don't look broken.
- Shortcuts sheet gains a Print row when shipped.
- Must not grow permanent chrome (no Print toolbar button required if hotkey + Shortcuts row suffice).

## Acceptance

1. `Ctrl+P` / `⌘P` invokes OS print dialog with current doc content.
2. User can select a network printer already configured in the OS.
3. Esc / cancel dialog leaves the editor unchanged; no leftover print chrome.
4. No in-app printer manager or account/cloud print UI.
