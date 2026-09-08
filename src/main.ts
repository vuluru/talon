import { Editor } from './editor';
import { FileManager } from './fileManager';
import { Preview } from './preview';
import { AIService, AIAction } from './ai';
import { loadSettings, saveSettings, hasApiKey } from './settings';
import { countWords, modKeyLabel } from './utils';
import { Toast } from './toast';

class TalonApp {
  private editor: Editor;
  private fileManager: FileManager;
  private preview: Preview;
  private aiService: AIService;
  private aiPendingResult: { text: string; isWholeDocument: boolean; action: AIAction } | null = null;
  private aiRequestInFlight: boolean = false;
  private aiAbortController: AbortController | null = null;
  private lastAnchorRect: DOMRect | null = null;
  private aiComposeMode: boolean = false;

  constructor() {
    // Initialize components
    this.editor = new Editor(document.getElementById('editor')!);
    this.fileManager = new FileManager();
    this.preview = new Preview(document.getElementById('preview')!);
    this.aiService = new AIService();

    // Setup platform-aware shortcuts
    this.setupPlatformShortcuts();

    // Setup event handlers
    this.setupKeyboardShortcuts();
    this.setupEditor();
    this.setupModals();
    this.setupMenuCommands();

    // Focus editor
    this.editor.focus();
    this.updateUI();
  }

  private setupPlatformShortcuts(): void {
    const modKey = modKeyLabel();
    
    // Update hide-preview button
    const hidePreviewBtn = document.getElementById('hide-preview')!;
    hidePreviewBtn.textContent = `Hide ${modKey}\\`;
    hidePreviewBtn.title = `Hide Preview (${modKey}\\)`;
    
    // Update footer summon hint
    const footerHint = document.getElementById('footer-summon-hint')!;
    footerHint.textContent = `${modKey}+J`;
  }

  private setupEditor(): void {
    this.editor.onChange((content) => {
      this.fileManager.setDirty(true);
      if (this.preview.isVisible()) {
        this.preview.update(content);
      }
      this.updateUI();
    });

    this.editor.onSelectionChange(() => {
      // Reposition AI card if visible and not busy (idle result state)
      if (this.isAICardVisible() && !this.aiRequestInFlight) {
        this.positionAICard();
      }
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
        // Handle Enter in compose mode
        if (this.aiComposeMode && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          // Check if focus is in the compose input
          const composeInput = document.getElementById('ai-compose-input') as HTMLInputElement;
          if (document.activeElement === composeInput) {
            e.preventDefault();
            this.aiComposeSubmit();
            return;
          }
        }
        
        // Handle Enter for apply
        if (!this.aiComposeMode && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.aiApply();
          return;
        }
        
        // Handle Esc for dismiss
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
            this.togglePreview();
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

    // AI controls
    document.getElementById('ai-apply')?.addEventListener('click', () => {
      this.aiApply();
    });

    document.getElementById('ai-dismiss')?.addEventListener('click', () => {
      this.aiDismiss();
    });

    document.getElementById('ai-compose')?.addEventListener('click', () => {
      this.aiComposeSubmit();
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
      Toast.error('Failed to open file: ' + (error as Error).message);
    }
  }

  private async saveFile(): Promise<void> {
    try {
      const success = await this.fileManager.saveFile(this.editor.getContent());
      if (!success) {
        Toast.error('Failed to save file');
      } else {
        this.fileManager.setDirty(false);
        this.updateUI();
      }
    } catch (error) {
      Toast.error('Failed to save file: ' + (error as Error).message);
    }
  }

  private async saveFileAs(): Promise<void> {
    try {
      const success = await this.fileManager.saveFileAs(this.editor.getContent());
      if (!success) {
        Toast.error('Failed to save file');
      } else {
        this.fileManager.setDirty(false);
        this.updateUI();
      }
    } catch (error) {
      Toast.error('Failed to save file: ' + (error as Error).message);
    }
  }

  private hidePreview(): void {
    this.preview.hide();
    this.updateUI();
  }

  private togglePreview(): void {
    this.preview.toggle();
    if (this.preview.isVisible()) {
      this.preview.update(this.editor.getContent());
    }
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
    // Ignore re-summon while request is in flight (no queue)
    if (this.aiRequestInFlight) {
      return;
    }

    // Check if API key is missing
    if (!hasApiKey()) {
      Toast.info('Add a provider key to summon AI · keys stay on this device', 4000);
      return;
    }

    const content = this.editor.getContent();
    const isEmptyBuffer = content.trim().length === 0;

    // Check for empty buffer → compose mode
    if (isEmptyBuffer) {
      this.showComposePrompt();
      return;
    }

    // Non-empty buffer: existing rewrite/summon behavior
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

    // Mark request in flight
    this.aiRequestInFlight = true;
    this.aiAbortController = new AbortController();

    // Show AI card immediately with pending state
    const actionLabels: Record<AIAction, string> = {
      rewrite: 'Rewriting…',
      shorten: 'Working…',
      outline: 'Working…',
      'extract-decisions': 'Working…',
      compose: 'Working…',
    };

    const cardLabel = document.getElementById('ai-card-label')!;
    cardLabel.textContent = actionLabels[action];

    const cardContent = document.getElementById('ai-card-content')!;
    cardContent.textContent = '';

    const scopeChip = document.getElementById('ai-scope-chip')!;
    if (isWholeDocument) {
      scopeChip.textContent = 'Scope: whole document';
      scopeChip.style.display = 'inline-block';
    } else {
      scopeChip.textContent = 'Scope: selection';
      scopeChip.style.display = 'inline-block';
    }

    // Disable Apply and More buttons during pending state
    this.setAICardBusy(true);

    this.positionAICard();
    this.showAICard();

    try {
      const response = await this.aiService.processText(textToProcess, action, this.aiAbortController.signal);
      
      // Check if aborted
      if (this.aiAbortController.signal.aborted) {
        return;
      }

      this.aiPendingResult = {
        text: response.text,
        isWholeDocument,
        action,
      };

      // Update AI card with result
      cardContent.textContent = response.text;
      
      const resultLabels: Record<AIAction, string> = {
        rewrite: 'Rewrite for clarity',
        shorten: 'Shorten',
        outline: 'Outline',
        'extract-decisions': 'Extract → ## Decisions',
        compose: 'New draft',
      };
      cardLabel.textContent = resultLabels[action];

      // Enable Apply and More buttons
      this.setAICardBusy(false);
    } catch (error) {
      // Only show error if not aborted
      if (!this.aiAbortController?.signal.aborted) {
        Toast.error('AI processing failed: ' + (error as Error).message);
      }
      this.hideAICard();
    } finally {
      this.aiRequestInFlight = false;
      this.aiAbortController = null;
    }
  }

  private positionAICard(): void {
    const card = document.getElementById('ai-card')!;
    
    // Get anchor rect (selection or caret)
    let anchorRect = this.editor.getSelectionRect();
    if (!anchorRect) {
      anchorRect = this.editor.getCaretRect();
    }
    
    if (!anchorRect) {
      // Fallback: prefer last-known anchor, else editor pane top-left
      if (this.lastAnchorRect) {
        anchorRect = this.lastAnchorRect;
      } else {
        // Use editor container as anchor
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
          const editorRect = editorContainer.getBoundingClientRect();
          anchorRect = new DOMRect(editorRect.left, editorRect.top, 0, 0);
        } else {
          // Ultimate fallback: viewport top-left
          anchorRect = new DOMRect(0, 0, 0, 0);
        }
      }
    } else {
      // Store successful anchor for future fallback
      this.lastAnchorRect = anchorRect;
    }

    // Position card 8-12px below-right of anchor (using 10px as middle value)
    const offset = 10;
    let cardLeft = anchorRect.left + offset;
    let cardTop = anchorRect.bottom + offset;

    // Get card dimensions (need to temporarily show it to measure)
    const wasVisible = card.style.display !== 'none';
    if (!wasVisible) {
      card.style.visibility = 'hidden';
      card.style.display = 'block';
    }
    
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    if (!wasVisible) {
      card.style.visibility = '';
      card.style.display = 'none';
    }

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Flip above if near bottom of viewport
    if (cardTop + cardHeight > viewportHeight - 20) {
      cardTop = anchorRect.top - cardHeight - offset;
      // If still doesn't fit, clamp to viewport
      if (cardTop < 20) {
        cardTop = 20;
      }
    }

    // Clamp horizontally to viewport
    if (cardLeft + cardWidth > viewportWidth - 20) {
      cardLeft = viewportWidth - cardWidth - 20;
    }
    if (cardLeft < 20) {
      cardLeft = 20;
    }

    // Apply positioning
    card.style.left = `${cardLeft}px`;
    card.style.top = `${cardTop}px`;
    card.style.transform = 'none';
  }

  private showComposePrompt(): void {
    this.aiComposeMode = true;

    const cardLabel = document.getElementById('ai-card-label')!;
    cardLabel.textContent = 'New draft';

    const scopeChip = document.getElementById('ai-scope-chip')!;
    scopeChip.textContent = 'Scope: Compose';
    scopeChip.style.display = 'inline-block';

    const promptContainer = document.getElementById('ai-card-prompt')!;
    promptContainer.style.display = 'block';

    const composeInput = document.getElementById('ai-compose-input') as HTMLInputElement;
    composeInput.value = '';

    const cardContent = document.getElementById('ai-card-content')!;
    cardContent.style.display = 'none';

    const composeBtn = document.getElementById('ai-compose') as HTMLButtonElement;
    composeBtn.style.display = 'inline-block';
    composeBtn.disabled = false;

    const applyBtn = document.getElementById('ai-apply') as HTMLButtonElement;
    applyBtn.style.display = 'none';

    const moreBtn = document.getElementById('ai-more') as HTMLButtonElement;
    moreBtn.style.display = 'none';

    this.positionAICard();
    this.showAICard();

    // Focus the input
    setTimeout(() => composeInput.focus(), 50);
  }

  private async aiComposeSubmit(): Promise<void> {
    const composeInput = document.getElementById('ai-compose-input') as HTMLInputElement;
    const prompt = composeInput.value.trim();

    if (!prompt) {
      return;
    }

    // Mark request in flight
    this.aiRequestInFlight = true;
    this.aiAbortController = new AbortController();

    // Hide prompt input, show Working state
    const promptContainer = document.getElementById('ai-card-prompt')!;
    promptContainer.style.display = 'none';

    const cardLabel = document.getElementById('ai-card-label')!;
    cardLabel.textContent = 'Working…';

    const cardContent = document.getElementById('ai-card-content')!;
    cardContent.style.display = 'block';
    cardContent.textContent = '';

    // Disable compose button
    const composeBtn = document.getElementById('ai-compose') as HTMLButtonElement;
    composeBtn.disabled = true;

    try {
      const response = await this.aiService.composeFromPrompt(prompt, this.aiAbortController.signal);

      // Check if aborted
      if (this.aiAbortController.signal.aborted) {
        return;
      }

      this.aiPendingResult = {
        text: response.text,
        isWholeDocument: true,
        action: 'compose',
      };

      // Exit compose mode so Enter key routes to Apply
      this.aiComposeMode = false;

      // Update AI card with result
      cardContent.textContent = response.text;
      cardLabel.textContent = 'New draft';

      // Show scope chip with prompt echo
      const scopeChip = document.getElementById('ai-scope-chip')!;
      scopeChip.textContent = `Scope: New draft`;
      scopeChip.style.display = 'inline-block';

      // Hide compose button, show apply button
      composeBtn.style.display = 'none';
      const applyBtn = document.getElementById('ai-apply') as HTMLButtonElement;
      applyBtn.style.display = 'inline-block';
      applyBtn.disabled = false;

      // Keep More button hidden for compose drafts
      const moreBtn = document.getElementById('ai-more') as HTMLButtonElement;
      moreBtn.style.display = 'none';
    } catch (error) {
      // Only show error if not aborted
      if (!this.aiAbortController?.signal.aborted) {
        Toast.error('AI processing failed: ' + (error as Error).message);
      }
      this.hideAICard();
      this.aiComposeMode = false;
    } finally {
      this.aiRequestInFlight = false;
      this.aiAbortController = null;
    }
  }

  private aiApply(): void {
    if (!this.aiPendingResult) return;

    const { text, isWholeDocument, action } = this.aiPendingResult;

    if (action === 'compose') {
      // Compose always sets the whole document (buffer was empty)
      this.editor.setContent(text);
    } else if (action === 'extract-decisions') {
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
    this.aiComposeMode = false;
    this.hideAICard();
    this.updateUI();
  }

  private aiDismiss(): void {
    // Cancel in-flight request if any
    if (this.aiAbortController) {
      this.aiAbortController.abort();
      this.aiAbortController = null;
    }
    
    this.aiRequestInFlight = false;
    this.aiPendingResult = null;
    this.aiComposeMode = false;
    this.hideAICard();
    
    // Reset UI state
    const promptContainer = document.getElementById('ai-card-prompt')!;
    promptContainer.style.display = 'none';
    
    const cardContent = document.getElementById('ai-card-content')!;
    cardContent.style.display = 'block';
    
    const composeBtn = document.getElementById('ai-compose') as HTMLButtonElement;
    composeBtn.style.display = 'none';
    
    const applyBtn = document.getElementById('ai-apply') as HTMLButtonElement;
    applyBtn.style.display = 'inline-block';
    
    const moreBtn = document.getElementById('ai-more') as HTMLButtonElement;
    moreBtn.style.display = 'inline-block';
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

  private setAICardBusy(busy: boolean): void {
    const applyBtn = document.getElementById('ai-apply') as HTMLButtonElement;
    const moreBtn = document.getElementById('ai-more') as HTMLButtonElement;
    
    applyBtn.disabled = busy;
    moreBtn.disabled = busy;
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
