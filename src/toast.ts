// Toast notification system for non-blocking feedback
export class Toast {
  private static container: HTMLElement | null = null;

  private static getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  static show(message: string, type: 'info' | 'error' = 'info', duration: number = 3000): void {
    const container = this.getContainer();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
      background: ${type === 'error' ? '#d32f2f' : '#2b2b2b'};
      color: #e0e0e0;
      padding: 12px 16px;
      border-radius: 6px;
      border: 1px solid ${type === 'error' ? '#f44336' : '#4a4a4a'};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      font-size: 13px;
      max-width: 400px;
      pointer-events: auto;
      animation: toast-slide-in 0.2s ease-out;
    `;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.animation = 'toast-slide-out 0.2s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, duration);
  }

  static error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  static info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }
}
