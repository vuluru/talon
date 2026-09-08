import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/commands';

export class Editor {
  private view: EditorView;
  private onChangeCallback?: (content: string) => void;

  constructor(parent: HTMLElement) {
    const state = EditorState.create({
      doc: '',
      extensions: [
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && this.onChangeCallback) {
            this.onChangeCallback(this.getContent());
          }
        }),
        EditorView.theme({
          '&': {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
            height: '100%',
          },
          '.cm-content': {
            caretColor: '#e0e0e0',
            fontFamily: '"Courier New", monospace',
          },
          '.cm-cursor': {
            borderLeftColor: '#e0e0e0',
          },
          '.cm-selectionBackground': {
            backgroundColor: '#264f78 !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: '#264f78 !important',
          },
          '.cm-gutters': {
            backgroundColor: '#1e1e1e',
            color: '#858585',
            border: 'none',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#2b2b2b',
          },
        }),
      ],
    });

    this.view = new EditorView({
      state,
      parent,
    });
  }

  getContent(): string {
    return this.view.state.doc.toString();
  }

  setContent(content: string): void {
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: content,
      },
    });
  }

  getSelection(): { from: number; to: number; text: string } | null {
    const selection = this.view.state.selection.main;
    if (selection.from === selection.to) {
      return null;
    }
    return {
      from: selection.from,
      to: selection.to,
      text: this.view.state.doc.sliceString(selection.from, selection.to),
    };
  }

  getCursorPosition(): number {
    return this.view.state.selection.main.head;
  }

  replaceSelection(text: string): void {
    const selection = this.view.state.selection.main;
    this.view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: text,
      },
    });
  }

  onChange(callback: (content: string) => void): void {
    this.onChangeCallback = callback;
  }

  focus(): void {
    this.view.focus();
  }
}
