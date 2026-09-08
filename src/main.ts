import { Editor } from './editor';
import { FileManager } from './fileManager';
import { Preview } from './preview';
import { AIService, AIAction } from './ai';
import { loadSettings, saveSettings } from './settings';
import { getRecentFiles } from './recentFiles';

class TalonApp {
  private editor: Editor;
  private fileManager: FileManager;
  private preview: Preview;
  private aiService: AIService;
  private autosaveTimer: number | null = null;
  private aiPendingRewrite: string | null = null;
  private aiCurrentScope: 'selection' | 'document' = 'selection';

  constructor() {
    // Initialize components
    this.editor = new Editor(document.getElementById('editor')!);
    this.fileManager = new FileManager();
    this.preview = new Preview(document.getElementById('preview')!);
    this.aiService = new AIService();

    // Setup event handlers
    this.setupToolbar();
    this.setupKeyboardShortcuts();
    this.setupEditor();
    this.setupModals();
    this.startAutosave();

    // Focus editor
    this.editor.focus();
    this.updateStatus();
  }

  private setupEditor(): void {
    this.editor.onChange((content) => {
      this.fileManager.setDirty(true);
      if (this.preview.isVisible()) {
        this.preview.update(content);
      }
      this.updateStatus();
      this.updateAIButton();
    });

    this.fileManager.onDirtyStateChange(() => {
      this.updateStatus();
    });
  }

  private setupToolbar(): void {
    document.getElementById('new-file')?.addEventListener('click', () => this.newFile());
    document.getElementById('open-file')?.addEventListener('click', () => this.openFile());
    document.getElementById('save-file')?.addEventListener('click', () => this.saveFile());
    document.getElementById('save-as-file')?.addEventListener('click', () => this.saveFileAs());
    document.getElementById('toggle-preview')?.addEventListener('click', () => this.togglePreview());
    document.getElementById('recent-files')?.addEventListener('click', () => this.showRecentFiles());
    document.getElementById('ai-rewrite')?.addEventListener('click', () => this.aiSummon());
    document.getElementById('settings')?.addEventListener('click', () => this.showSettings());
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // AI panel keyboard shortcuts (when panel is visible)
      if (this.isAIPanelVisible()) {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.aiApply();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.aiDismiss();
          return;
        }
      }

      // Global keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'j':
            e.preventDefault();
            this.aiSummon();
            break;
          case 'n':
            e.preventDefault();
            this.newFile();
            break;
          case 'o':
            e.preventDefault();
            this.openFile();
            break;
          case 's':
            e.preventDefault();
            this.saveFile();
            break;
          case 'p':
            e.preventDefault();
            this.togglePreview();
            break;
          case '\\':
            e.preventDefault();
            if (this.isAIPanelVisible()) {
              this.aiDismiss();
            }
            break;
          case ',':
            e.preventDefault();
            this.showSettings();
            break;
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveFileAs();
      }
    });
  }

  private setupModals(): void {
    // Settings modal
    document.getElementById('save-settings')?.addEventListener('click', () => {
      const apiKey = (document.getElementById('api-key-input') as HTMLInputElement).value;
      const autosaveInterval = parseInt(
        (document.getElementById('autosave-interval') as HTMLInputElement).value
      );

      saveSettings({ apiKey, autosaveInterval });
      this.hideModal();
      this.restartAutosave();
    });

    document.getElementById('cancel-settings')?.addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('close-recent')?.addEventListener('click', () => {
      this.hideModal();
    });

    // AI controls
    document.getElementById('ai-apply')?.addEventListener('click', () => {
      this.aiApply();
    });

    document.getElementById('ai-dismiss')?.addEventListener('click', () => {
      this.aiDismiss();
    });

    // AI More menu
    document.getElementById('ai-more')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('ai-more-menu')!;
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('#ai-more-menu button').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const action = (e.target as HTMLElement).dataset.action as AIAction;
        await this.aiProcessWithAction(action);
        document.getElementById('ai-more-menu')!.style.display = 'none';
      });
    });

    // Close More menu when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('ai-more-menu')!;
      const moreBtn = document.getElementById('ai-more')!;
      if (!menu.contains(e.target as Node) && e.target !== moreBtn) {
        menu.style.display = 'none';
      }
    });

    // Close modal on backdrop click
    document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });
  }

  private async newFile(): Promise<void> {
    if (this.fileManager.isDirtyState()) {
      if (!confirm('You have unsaved changes. Continue?')) {
        return;
      }
    }

    this.editor.setContent('');
    this.fileManager.setCurrentFilePath(null);
    this.fileManager.setDirty(false);
    this.editor.focus();
  }

  private async openFile(): Promise<void> {
    if (this.fileManager.isDirtyState()) {
      if (!confirm('You have unsaved changes. Continue?')) {
        return;
      }
    }

    try {
      const content = await this.fileManager.openFile();
      if (content !== null) {
        this.editor.setContent(content);
        this.fileManager.setDirty(false);
        if (this.preview.isVisible()) {
          this.preview.update(content);
        }
      }
    } catch (error) {
      alert('Failed to open file: ' + error);
    }
  }

  private async saveFile(): Promise<void> {
    try {
      const success = await this.fileManager.saveFile(this.editor.getContent());
      if (success) {
        this.fileManager.setDirty(false);
      } else {
        alert('Failed to save file');
      }
    } catch (error) {
      alert('Failed to save file: ' + error);
    }
  }

  private async saveFileAs(): Promise<void> {
    try {
      const success = await this.fileManager.saveFileAs(this.editor.getContent());
      if (success) {
        this.fileManager.setDirty(false);
      } else {
        alert('Failed to save file');
      }
    } catch (error) {
      alert('Failed to save file: ' + error);
    }
  }

  private togglePreview(): void {
    this.preview.toggle();
    if (this.preview.isVisible()) {
      this.preview.update(this.editor.getContent());
    }
  }

  private showRecentFiles(): void {
    const recent = getRecentFiles();
    const list = document.getElementById('recent-list')!;
    list.innerHTML = '';

    if (recent.length === 0) {
      list.innerHTML = '<p style="color: #999;">No recent files</p>';
    } else {
      recent.forEach((path) => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.textContent = path;
        item.addEventListener('click', async () => {
          if (this.fileManager.isDirtyState()) {
            if (!confirm('You have unsaved changes. Continue?')) {
              return;
            }
          }

          try {
            const content = await this.fileManager.readFile(path);
            this.editor.setContent(content);
            this.fileManager.setCurrentFilePath(path);
            this.fileManager.setDirty(false);
            this.hideModal();
            if (this.preview.isVisible()) {
              this.preview.update(content);
            }
          } catch (error) {
            alert('Failed to open file: ' + error);
          }
        });
        list.appendChild(item);
      });
    }

    this.showModal('recent-modal');
  }

  private showSettings(): void {
    const settings = loadSettings();
    (document.getElementById('api-key-input') as HTMLInputElement).value = settings.apiKey;
    (document.getElementById('autosave-interval') as HTMLInputElement).value =
      settings.autosaveInterval.toString();
    this.showModal('settings-modal');
  }

  private async aiSummon(): Promise<void> {
    await this.aiProcessWithAction('rewrite');
  }

  private async aiProcessWithAction(action: AIAction): Promise<void> {
    const selection = this.editor.getSelection();
    
    let textToProcess: string;
    if (selection) {
      // Selection mode
      textToProcess = selection.text;
      this.aiCurrentScope = 'selection';
    } else {
      // Whole document mode
      textToProcess = this.editor.getContent();
      this.aiCurrentScope = 'document';
    }

    if (!textToProcess.trim()) {
      alert('No content to process');
      return;
    }

    const actionLabels: Record<AIAction, string> = {
      rewrite: 'Rewrite',
      shorten: 'Shorten',
      outline: 'Outline',
      'extract-decisions': 'Extract Decisions',
    };

    this.showStatus(`AI ${actionLabels[action].toLowerCase()}...`);
    try {
      const response = await this.aiService.processText(textToProcess, action);
      this.aiPendingRewrite = response.text;

      // Update UI
      const aiContent = document.getElementById('ai-content')!;
      aiContent.textContent = response.text;
      if (response.isMock) {
        aiContent.textContent = '[MOCK RESPONSE - Add API key in Settings]\n\n' + response.text;
      }

      // Update action label
      document.getElementById('ai-action-label')!.textContent = actionLabels[action];

      // Update scope chip
      const scopeChip = document.getElementById('ai-scope-chip')!;
      if (this.aiCurrentScope === 'document') {
        scopeChip.textContent = 'Whole document';
        scopeChip.style.display = 'inline-block';
      } else {
        scopeChip.style.display = 'none';
      }

      this.showAIPanel();
    } catch (error) {
      alert('AI processing failed: ' + error);
    } finally {
      this.updateStatus();
    }
  }

  private aiApply(): void {
    if (!this.aiPendingRewrite) return;

    if (this.aiCurrentScope === 'document') {
      // Replace whole document
      this.editor.setContent(this.aiPendingRewrite);
    } else {
      // Replace selection
      this.editor.replaceSelection(this.aiPendingRewrite);
    }

    this.aiPendingRewrite = null;
    this.hideAIPanel();
  }

  private aiDismiss(): void {
    this.aiPendingRewrite = null;
    this.hideAIPanel();
  }

  private showModal(modalId: string): void {
    const backdrop = document.getElementById('modal-backdrop')!;
    backdrop.style.display = 'flex';

    // Hide all modals
    document.querySelectorAll('.modal').forEach((modal) => {
      (modal as HTMLElement).style.display = 'none';
    });

    // Show selected modal
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  }

  private hideModal(): void {
    const backdrop = document.getElementById('modal-backdrop')!;
    backdrop.style.display = 'none';
  }

  private showAIPanel(): void {
    const panel = document.getElementById('ai-panel')!;
    panel.style.display = 'block';
  }

  private hideAIPanel(): void {
    const panel = document.getElementById('ai-panel')!;
    panel.style.display = 'none';
    document.getElementById('ai-more-menu')!.style.display = 'none';
  }

  private isAIPanelVisible(): boolean {
    const panel = document.getElementById('ai-panel')!;
    return panel.style.display !== 'none';
  }

  private updateStatus(): void {
    const status = document.getElementById('status')!;
    const parts: string[] = [];

    if (this.fileManager.getCurrentFilePath()) {
      parts.push(this.fileManager.getCurrentFilePath()!.split('/').pop()!);
    } else {
      parts.push('Untitled');
    }

    if (this.fileManager.isDirtyState()) {
      parts.push('*');
    }

    status.textContent = parts.join(' ');
  }

  private showStatus(message: string): void {
    const status = document.getElementById('status')!;
    status.textContent = message;
  }

  private updateAIButton(): void {
    const button = document.getElementById('ai-rewrite') as HTMLButtonElement;
    // Always enabled now (empty selection = whole document)
    button.disabled = false;
  }

  private startAutosave(): void {
    const settings = loadSettings();
    this.autosaveTimer = window.setInterval(() => {
      if (this.fileManager.isDirtyState() && this.fileManager.getCurrentFilePath()) {
        this.saveFile();
      }
    }, settings.autosaveInterval * 1000);
  }

  private restartAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
    this.startAutosave();
  }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new TalonApp();
});
