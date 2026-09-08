// Settings management
export type AIProvider = 'openai' | 'anthropic' | 'xai';

interface Settings {
  provider: AIProvider;
  apiKey: string;
}

const SETTINGS_KEY = 'talon-settings';

export function loadSettings(): Settings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    provider: 'openai',
    apiKey: '',
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getProvider(): AIProvider {
  return loadSettings().provider;
}

export function getApiKey(): string {
  return loadSettings().apiKey;
}

export function hasApiKey(): boolean {
  return loadSettings().apiKey.trim().length > 0;
}
