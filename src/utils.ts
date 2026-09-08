// Utility functions
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function modKeyLabel(): string {
  const platform = navigator.platform.toLowerCase();
  const isMac = platform.includes('mac');
  return isMac ? '⌘' : 'Ctrl';
}
