import { marked } from 'marked';

export class Preview {
  private container: HTMLElement;
  private containerParent: HTMLElement | null;
  private visible: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.containerParent = container.parentElement;
  }

  update(markdown: string): void {
    const html = marked.parse(markdown) as string;
    this.container.innerHTML = html;
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.containerParent) {
      this.containerParent.style.display = this.visible ? 'block' : 'none';
    }
  }

  show(): void {
    this.visible = true;
    if (this.containerParent) {
      this.containerParent.style.display = 'block';
    }
  }

  hide(): void {
    this.visible = false;
    if (this.containerParent) {
      this.containerParent.style.display = 'none';
    }
  }

  isVisible(): boolean {
    return this.visible;
  }
}

