import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/commands';
import { 
  search, 
  openSearchPanel, 
  closeSearchPanel, 
  findNext, 
  findPrevious,
  setSearchQuery,
  SearchQuery,
  getSearchQuery
} from '@codemirror/search';

export class Editor {
  private view: EditorView;
  private onChangeCallback?: (content: string) => void;
  private onSelectionChangeCallback?: () => void;

  constructor(parent: HTMLElement) {
    const state = EditorState.create({
      doc: '',
      extensions: [
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        search({
          createPanel: () => {
            return { dom: document.createElement('div'), top: true };
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && this.onChangeCallback) {
            this.onChangeCallback(this.getContent());
          }
          if (update.selectionSet && this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback();
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

  onSelectionChange(callback: () => void): void {
    this.onSelectionChangeCallback = callback;
  }

  focus(): void {
    this.view.focus();
  }

  getCaretRect(): DOMRect | null {
    const pos = this.view.state.selection.main.head;
    const coords = this.view.coordsAtPos(pos);
    if (!coords) return null;
    
    return new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top);
  }

  getSelectionRect(): DOMRect | null {
    const selection = this.view.state.selection.main;
    if (selection.from === selection.to) return null;

    const fromCoords = this.view.coordsAtPos(selection.from);
    const toCoords = this.view.coordsAtPos(selection.to);
    
    if (!fromCoords || !toCoords) return null;

    const left = Math.min(fromCoords.left, toCoords.left);
    const right = Math.max(fromCoords.right, toCoords.right);
    const top = Math.min(fromCoords.top, toCoords.top);
    const bottom = Math.max(fromCoords.bottom, toCoords.bottom);

    return new DOMRect(left, top, right - left, bottom - top);
  }

  openFind(): void {
    openSearchPanel(this.view);
  }

  closeFind(): void {
    closeSearchPanel(this.view);
  }

  findNext(): void {
    findNext(this.view);
  }

  findPrevious(): void {
    findPrevious(this.view);
  }

  setFindQuery(query: string): void {
    const searchQuery = new SearchQuery({
      search: query,
      caseSensitive: false,
      regexp: false,
      wholeWord: false,
    });
    this.view.dispatch({ effects: setSearchQuery.of(searchQuery) });
  }

  getFindQuery(): string {
    const query = getSearchQuery(this.view.state);
    return query.search;
  }

  getMatchCount(): { current: number; total: number } | null {
    const query = getSearchQuery(this.view.state);
    if (!query.search) {
      return null;
    }

    const content = this.getContent();
    const searchText = query.search;
    
    if (searchText.length === 0) {
      return null;
    }

    const matches: number[] = [];
    let index = 0;
    const lowerContent = query.caseSensitive ? content : content.toLowerCase();
    const lowerSearch = query.caseSensitive ? searchText : searchText.toLowerCase();

    while ((index = lowerContent.indexOf(lowerSearch, index)) !== -1) {
      matches.push(index);
      index += searchText.length;
    }

    if (matches.length === 0) {
      return null;
    }

    const cursorPos = this.getCursorPosition();
    let current = 1;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i] >= cursorPos) {
        current = i + 1;
        break;
      }
      if (i === matches.length - 1) {
        current = matches.length;
      }
    }

    return { current, total: matches.length };
  }
}
