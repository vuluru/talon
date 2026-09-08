// Recent files management
const RECENT_FILES_KEY = 'talon-recent-files';
const MAX_RECENT_FILES = 10;

export function getRecentFiles(): string[] {
  const stored = localStorage.getItem(RECENT_FILES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

export function addRecentFile(path: string): void {
  let recent = getRecentFiles();
  // Remove if already exists
  recent = recent.filter(p => p !== path);
  // Add to front
  recent.unshift(path);
  // Limit size
  recent = recent.slice(0, MAX_RECENT_FILES);
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recent));
}
