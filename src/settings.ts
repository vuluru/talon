// Settings management
interface Settings {
  apiKey: string;
  autosaveInterval: number;
}

const SETTINGS_KEY = 'talon-settings';

export function loadSettings(): Settings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    apiKey: '',
    autosaveInterval: 30,
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getApiKey(): string {
  return loadSettings().apiKey;
}

export function getAutosaveInterval(): number {
  return loadSettings().autosaveInterval;
}
