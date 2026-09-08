import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { addRecentFile } from './recentFiles';

export class FileManager {
  private currentFilePath: string | null = null;
  private isDirty: boolean = false;
  private onDirtyChange?: (dirty: boolean) => void;

  getCurrentFilePath(): string | null {
    return this.currentFilePath;
  }

  setCurrentFilePath(path: string | null): void {
    this.currentFilePath = path;
    if (path) {
      addRecentFile(path);
    }
  }

  isDirtyState(): boolean {
    return this.isDirty;
  }

  setDirty(dirty: boolean): void {
    this.isDirty = dirty;
    if (this.onDirtyChange) {
      this.onDirtyChange(dirty);
    }
  }

  onDirtyStateChange(callback: (dirty: boolean) => void): void {
    this.onDirtyChange = callback;
  }

  async openFile(): Promise<string | null> {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Markdown (*.md)',
          extensions: ['md'],
        },
        {
          name: 'All files',
          extensions: ['*'],
        },
      ],
    });

    if (!selected || typeof selected !== 'string') {
      return null;
    }

    const content = await readTextFile(selected);
    this.currentFilePath = selected;
    this.isDirty = false;
    addRecentFile(selected);
    return content;
  }

  async saveFile(content: string): Promise<boolean> {
    if (!this.currentFilePath) {
      return this.saveFileAs(content);
    }

    try {
      await writeTextFile(this.currentFilePath, content);
      this.isDirty = false;
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  async saveFileAs(content: string): Promise<boolean> {
    const path = await save({
      defaultPath: 'untitled.md',
      filters: [
        {
          name: 'Markdown (*.md)',
          extensions: ['md'],
        },
        {
          name: 'All files',
          extensions: ['*'],
        },
      ],
    });

    if (!path) {
      return false;
    }

    try {
      await writeTextFile(path, content);
      this.currentFilePath = path;
      this.isDirty = false;
      addRecentFile(path);
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  async readFile(path: string): Promise<string> {
    return await readTextFile(path);
  }
}
