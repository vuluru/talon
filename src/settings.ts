// Settings management
export type AIProvider = 'openai' | 'anthropic' | 'xai';

interface Settings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const SETTINGS_KEY = 'talon-settings';

// Single source of truth for provider → default model mapping
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  'xai': 'grok-4.6',
  'openai': 'gpt-4.1',
  'anthropic': 'claude-sonnet-4-6',
};

export function getDefaultModel(provider: AIProvider): string {
  return DEFAULT_MODELS[provider];
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
  // Normalize: if model is empty, use provider default
  const normalizedSettings = {
    ...settings,
    model: settings.model.trim() || getDefaultModel(settings.provider),
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizedSettings));
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
  const settings = loadSettings();
  // Fallback: if stored model is empty, return provider default
  return settings.model.trim() || getDefaultModel(settings.provider);
}
