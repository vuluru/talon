// Settings management
export type AIProvider = 'openai' | 'anthropic' | 'xai';

interface Settings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const SETTINGS_KEY = 'talon-settings';

export function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'xai':
      return 'grok-4.6';
    case 'openai':
      return 'gpt-4.1';
    case 'anthropic':
      return 'claude-sonnet-4-6';
    default:
      return 'gpt-4.1';
  }
}

export function loadSettings(): Settings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    const settings = JSON.parse(stored);
    // Ensure model field exists (migration for existing settings)
    if (!settings.model) {
      settings.model = getDefaultModel(settings.provider);
    }
    return settings;
  }
  const provider = 'openai';
  return {
    provider,
    apiKey: '',
    model: getDefaultModel(provider),
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

export function getModel(): string {
  return loadSettings().model;
}
