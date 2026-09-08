import { marked } from 'marked';

export class Preview {
  private container: HTMLElement;
  private visible: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  update(markdown: string): void {
    const html = marked.parse(markdown) as string;
    this.container.innerHTML = html;
  }

  toggle(): void {
    this.visible = !this.visible;
    const previewContainer = this.container.parentElement;
    if (previewContainer) {
      previewContainer.style.display = this.visible ? 'block' : 'none';
    }
  }

  isVisible(): boolean {
    return this.visible;
  }
}
