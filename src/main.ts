import { Editor } from './editor';
import { FileManager } from './fileManager';
import { Preview } from './preview';
import { AIService, AIAction } from './ai';
import { loadSettings, saveSettings, hasApiKey } from './settings';
import { countWords } from './utils';

class TalonApp {
  private editor: Editor;
  private fileManager: FileManager;
  private preview: Preview;
  private aiService: AIService;
  private aiPendingResult: { text: string; isWholeDocument: boolean; action: AIAction } | null = null;

  constructor() {
    // Initialize components
    this.editor = new Editor(document.getElementById('editor')!);
    this.fileManager = new FileManager();
    this.preview = new Preview(document.getElementById('preview')!);
    this.aiService = new AIService();

    // Setup event handlers
    this.setupKeyboardShortcuts();
    this.setupEditor();
    this.setupModals();
    this.setupMenuCommands();

    // Focus editor
    this.editor.focus();
    this.updateUI();
  }

  private setupEditor(): void {
    this.editor.onChange((content) => {
      this.fileManager.setDirty(true);
      if (this.preview.isVisible()) {
        this.preview.update(content);
      }
      this.updateUI();
    });

    this.fileManager.onDirtyStateChange(() => {
      this.updateUI();
    });
  }

  private setupMenuCommands(): void {
    // File menu commands (via keyboard shortcuts)
    // Settings handled in setupModals
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // AI card keyboard shortcuts (when panel is visible)
      if (this.isAICardVisible()) {
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
            this.aiSummon('rewrite');
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
          case '\\':
            e.preventDefault();
            if (this.preview.isVisible()) {
              this.hidePreview();
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
      const provider = (document.querySelector('input[name="provider"]:checked') as HTMLInputElement).value as any;
      const apiKey = (document.getElementById('api-key-input') as HTMLInputElement).value;

      saveSettings({ provider, apiKey });
      this.hideModal();
    });

    document.getElementById('cancel-settings')?.addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('close-recent')?.addEventListener('click', () => {
      this.hideModal();
    });

    // Missing key hint modal
    document.getElementById('open-settings-from-hint')?.addEventListener('click', () => {
      this.hideModal();
      this.showSettings();
    });

    document.getElementById('close-hint')?.addEventListener('click', () => {
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
        await this.aiSummon(action);
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

    // Preview hide button
    document.getElementById('hide-preview')?.addEventListener('click', () => {
      this.hidePreview();
    });

    // Close modal on backdrop click
    document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });

    // Close modal on Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalVisible() && !this.isAICardVisible()) {
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
    this.updateUI();
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
        this.updateUI();
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
        this.updateUI();
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
        this.updateUI();
      } else {
        alert('Failed to save file');
      }
    } catch (error) {
      alert('Failed to save file: ' + error);
    }
  }

  private hidePreview(): void {
    this.preview.toggle();
    this.updateUI();
  }

  private showSettings(): void {
    const settings = loadSettings();
    
    // Set provider radio
    const providerRadio = document.querySelector(
      `input[name="provider"][value="${settings.provider}"]`
    ) as HTMLInputElement;
    if (providerRadio) {
      providerRadio.checked = true;
    }

    // Set API key
    (document.getElementById('api-key-input') as HTMLInputElement).value = settings.apiKey;
    
    this.showModal('settings-modal');
  }

  private async aiSummon(action: AIAction = 'rewrite'): Promise<void> {
    // Check if API key is missing
    if (!hasApiKey()) {
      this.showModal('missing-key-modal');
      return;
    }

    const selection = this.editor.getSelection();
    
    let textToProcess: string;
    let isWholeDocument: boolean;

    if (selection) {
      // Selection mode
      textToProcess = selection.text;
      isWholeDocument = false;
    } else {
      // No selection: whole document
      textToProcess = this.editor.getContent();
      isWholeDocument = true;
    }

    if (!textToProcess.trim()) {
      return; // Nothing to process
    }

    try {
      const response = await this.aiService.processText(textToProcess, action);
      this.aiPendingResult = {
        text: response.text,
        isWholeDocument,
        action,
      };

      // Update AI card
      const cardContent = document.getElementById('ai-card-content')!;
      cardContent.textContent = response.text;
      
      const cardLabel = document.getElementById('ai-card-label')!;
      const actionLabels: Record<AIAction, string> = {
        rewrite: 'Rewrite for clarity',
        shorten: 'Shorten',
        outline: 'Outline',
        'extract-decisions': 'Extract → ## Decisions',
      };
      cardLabel.textContent = actionLabels[action];

      // Update scope chip visibility and text
      const scopeChip = document.getElementById('ai-scope-chip')!;
      if (isWholeDocument) {
        scopeChip.textContent = 'Scope: whole document';
        scopeChip.style.display = 'inline-block';
      } else {
        scopeChip.textContent = 'Scope: selection';
        scopeChip.style.display = 'inline-block';
      }

      // Position card near cursor
      this.positionAICard();
      
      this.showAICard();
    } catch (error) {
      alert('AI processing failed: ' + error);
    }
  }

  private positionAICard(): void {
    const card = document.getElementById('ai-card')!;
    
    // Simple positioning: center of screen for now
    // In production, you'd position near the actual cursor/selection
    card.style.left = '50%';
    card.style.top = '30%';
    card.style.transform = 'translateX(-50%)';
  }

  private aiApply(): void {
    if (!this.aiPendingResult) return;

    const { text, isWholeDocument, action } = this.aiPendingResult;

    if (action === 'extract-decisions') {
      // Extract always appends to end of document
      const currentContent = this.editor.getContent();
      const newContent = currentContent.trim() + '\n\n' + text;
      this.editor.setContent(newContent);
    } else if (isWholeDocument) {
      // Replace whole document
      this.editor.setContent(text);
    } else {
      // Replace selection
      this.editor.replaceSelection(text);
    }

    this.aiPendingResult = null;
    this.hideAICard();
    this.updateUI();
  }

  private aiDismiss(): void {
    this.aiPendingResult = null;
    this.hideAICard();
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

  private isModalVisible(): boolean {
    const backdrop = document.getElementById('modal-backdrop')!;
    return backdrop.style.display !== 'none';
  }

  private showAICard(): void {
    const card = document.getElementById('ai-card')!;
    card.style.display = 'block';
  }

  private hideAICard(): void {
    const card = document.getElementById('ai-card')!;
    card.style.display = 'none';
  }

  private isAICardVisible(): boolean {
    const card = document.getElementById('ai-card')!;
    return card.style.display !== 'none';
  }

  private updateUI(): void {
    // Update title bar
    const fileName = document.getElementById('file-name')!;
    const currentPath = this.fileManager.getCurrentFilePath();
    if (currentPath) {
      const name = currentPath.split('/').pop() || 'untitled.md';
      fileName.textContent = name + (this.fileManager.isDirtyState() ? ' •' : '');
    } else {
      fileName.textContent = 'untitled.md' + (this.fileManager.isDirtyState() ? ' •' : '');
    }

    // Update footer
    const footerPath = document.getElementById('footer-path')!;
    footerPath.textContent = currentPath || '~/docs/untitled.md';

    const footerWordCount = document.getElementById('footer-word-count')!;
    const content = this.editor.getContent();
    const wordCount = countWords(content);
    footerWordCount.textContent = `${wordCount} word${wordCount === 1 ? '' : 's'}`;

    // Update placeholder visibility
    const placeholder = document.getElementById('editor-placeholder')!;
    if (content.trim().length === 0) {
      placeholder.classList.remove('hidden');
    } else {
      placeholder.classList.add('hidden');
    }
  }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new TalonApp();
});
