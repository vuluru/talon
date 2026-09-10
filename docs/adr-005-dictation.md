# ADR-005: In-app dictation (stub — parked)

**Status:** Proposed / Parked (not scheduled)  
**Date:** 2026-09-10  
**Owner:** Talon PM · **Implements:** Talon Build (when unparked) · **UX:** Talon Design  
**Related:** ADR-001 (thin chrome) · ADR-003 (BYO AI, ephemeral assists)

---

## Context

Jason asked whether dictation is feasible in Talon. Tech roles (esp. planners/execs) benefit from speech→caret; Omarchy users often already have OS/desktop STT. Talon must stay dead-simple — no voice-mode chrome or chatbot wallpaper.

## Decision (parked direction)

When unparked, prefer a **thin Dictate** path:

1. **Default now:** rely on OS/desktop dictation into the focused editor (zero Talon surface).
2. **vN candidate:** one hotkey (hold-to-talk), stream STT into the caret via **BYO STT key** (e.g. Whisper / Deepgram-class), Esc cancel — same ephemeral tone as summon. No docked mic panel, no menu-bar Help.
3. **Later Omarchy option:** local Whisper sidecar (privacy) — separate ADR addendum; heavier packaging.

**Out for this stub:** always-on listening, voice commands for app chrome, multi-speaker meetings, role "modes."

## Consequences

- Extends BYO-key settings (provider + STT key) without new account chrome.
- Mic permission + network/privacy copy required if cloud STT.
- Must not grow foot chrome beyond existing chip budget without Design lock.

## Backlog note

- **Blocked on:** Omarchy dogfood of v0.1.2 Shortcuts (+ AUR reopen path).
- **Unpark trigger:** Jason GO after dogfood; then Design pack → Build tip.
- **Non-goals until then:** no Design pixels, no Build spike, no release bake.

## Acceptance (when built)

1. Hotkey starts/stops dictate; text inserts at caret.
2. Esc cancels without leaving junk chrome.
3. BYO STT key stored locally (same "on this device" posture as ADR-003).
4. No permanent mic button / voice dock unless Design revises ADR-001 chrome budget.
