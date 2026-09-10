# ADR-006: Print to OS / network printer (stub — parked)

**Status:** Proposed / Parked (queued after thin lane)  
**Date:** 2026-09-10  
**Owner:** Talon PM · **Implements:** Talon Build (when unparked) · **UX:** Talon Design  
**Related:** ADR-001 (thin chrome) · preview (`Ctrl+\`) · Shortcuts sheet

---

## Context

Jason wants to print from Talon to a **network printer**. v0.1.2 has no Print/PDF/export. Network discovery and driver stacks belong to the OS (CUPS on Omarchy), not Talon.

## Decision (parked direction)

When unparked, prefer a **thin OS-print** path:

1. **`Ctrl+P` / ⌘P** opens the **system print dialog** on printable HTML derived from the current doc (prefer **preview** rendering, or a one-shot print stylesheet over the Markdown source view).
2. Network / local printers are chosen in the **OS dialog** — no in-app printer list, no Talon print server, no custom page-setup chrome beyond what the OS provides.
3. Optional later: “Save as PDF” only if it stays a single OS-dialog outcome (no export panel).

**Out for this stub:** cloud print services · in-app WYSIWYG page designer · print-preview chrome that duplicates the OS · silent/background printing without a dialog.

## Sequencing

- **Blocked on:** finish Jason’s thin lane — (1) shared foot-chip CSS · (2) soft Cargo meta · (4) Find · (5) Typewriter/focus scroll.
- **Unpark trigger:** Jason GO after that lane; then Design pack → Build tip.
- **Non-goals until then:** no Design pixels, no Build spike, no release bake for print.

## Consequences

- Relies on Tauri/webview print (or equivalent) bridging to the OS dialog.
- Preview quality ≈ print quality; Markdown-honest source may need a print CSS so headings/lists don’t look broken.
- Shortcuts sheet gains a Print row when shipped.
- Must not grow permanent chrome (no Print toolbar button required if hotkey + Shortcuts row suffice).

## Acceptance (when built)

1. `Ctrl+P` / `⌘P` invokes OS print dialog with current doc content.
2. User can select a network printer already configured in the OS.
3. Esc / cancel dialog leaves the editor unchanged; no leftover print chrome.
4. No in-app printer manager or account/cloud print UI.
