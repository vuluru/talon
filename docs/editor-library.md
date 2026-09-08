# Editor Library Decision (ADR-002 proposal)

## Context
Talon requires a Markdown source editor that aligns with ADR-001 constraints:
- Not WYSIWYG
- Markdown-honest source editing
- Fast cold start
- AI must never block typing

## Editor Library Decision (ADR-002 — spike-accepted)

**CodeMirror 6** was chosen for:
- Markdown-honest source editing (not WYSIWYG)
- Fast performance and small bundle size
- Extensible architecture
- Strong TypeScript support

TipTap and Lexical were considered but lean toward WYSIWYG/prose editing, which conflicts with ADR-001.

## Status
**Spike-accepted** — CodeMirror 6 is the editor core. Only reopen if Design contests later.
