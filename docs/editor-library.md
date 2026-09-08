# Editor Library Decision (ADR-002 proposal)

## Context
Talon requires a Markdown source editor that aligns with ADR-001 constraints:
- Not WYSIWYG
- Markdown-honest source editing
- Fast cold start
- AI must never block typing

## Decision
Use **CodeMirror 6** as the editor core.

## Rationale

### Why CodeMirror 6?
1. **Source-first editing**: Built for code and plain text editing, not WYSIWYG
2. **Performance**: Lightweight, fast startup, handles large documents efficiently
3. **Extensibility**: Modular architecture allows adding Markdown-specific features incrementally
4. **TypeScript support**: Strong typing and modern API
5. **Bundle size**: Minimal core with opt-in extensions keeps cold start fast

### Alternatives Considered

#### TipTap
- **Pros**: Modern, extensible, popular
- **Cons**: Built on ProseMirror (WYSIWYG document model), heavier abstractions, pulls toward rich text editing
- **Verdict**: Wrong default for ADR-001 (not WYSIWYG)

#### Lexical
- **Pros**: Facebook-backed, performant
- **Cons**: Framework-agnostic but optimized for React, WYSIWYG-first design philosophy
- **Verdict**: Same WYSIWYG concerns as TipTap

#### Monaco Editor
- **Pros**: VS Code's editor, feature-rich
- **Cons**: Heavy bundle size (~5MB), slow cold start, overkill for Markdown
- **Verdict**: Violates fast cold start constraint

## Status
**Proposed** — Implemented in v0 dogfood spike for validation.

## Consequences
- Positive: Clean source editing, fast startup, extensible for future Markdown features
- Positive: Low-level control over editor behavior for AI integration
- Neutral: No built-in Markdown preview (handled separately with marked)
- Negative: May need custom extensions for advanced Markdown features (tables, frontmatter)

## Future Considerations
If WYSIWYG becomes a hard requirement (unlikely per ADR-001), this decision may need revisiting. However, CodeMirror's flexibility allows hybrid approaches (e.g., inline preview widgets) without a full rewrite.
