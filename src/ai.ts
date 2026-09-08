import { getProvider, getApiKey } from './settings';
import type { AIProvider } from './settings';

export interface AIResponse {
  text: string;
  isMock: boolean;
}

export type AIAction = 'rewrite' | 'shorten' | 'outline' | 'extract-decisions' | 'compose';

export class AIService {
  async composeFromPrompt(prompt: string, signal?: AbortSignal): Promise<AIResponse> {
    const apiKey = getApiKey();
    const provider = getProvider();

    if (!apiKey) {
      return {
        text: this.generateMockCompose(prompt),
        isMock: true,
      };
    }

    try {
      const endpoint = this.getEndpoint(provider);
      const payload = this.getComposePayload(provider, prompt);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const resultText = this.extractResult(provider, data);

      if (!resultText) {
        throw new Error('Empty response from API');
      }

      return {
        text: resultText,
        isMock: false,
      };
    } catch (error) {
      throw error;
    }
  }

  async processText(text: string, action: AIAction = 'rewrite', signal?: AbortSignal): Promise<AIResponse> {
    const apiKey = getApiKey();
    const provider = getProvider();

    if (!apiKey) {
      // Return mock response when no key
      return {
        text: this.generateMockResponse(text, action),
        isMock: true,
      };
    }

    // Try to call real API with key present
    try {
      const endpoint = this.getEndpoint(provider);
      const payload = this.getPayload(provider, text, action);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        // Don't silently fall back to mock - throw error
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const resultText = this.extractResult(provider, data);

      if (!resultText) {
        throw new Error('Empty response from API');
      }

      return {
        text: resultText,
        isMock: false,
      };
    } catch (error) {
      // Re-throw error - don't silently fall back to mock
      throw error;
    }
  }

  private getEndpoint(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'xai':
        return 'https://api.x.ai/v1/chat/completions';
      default:
        return 'https://api.openai.com/v1/chat/completions';
    }
  }

  private getPayload(provider: AIProvider, text: string, action: AIAction): any {
    const systemPrompt = this.getSystemPrompt(action);
    const userPrompt = this.getUserPrompt(text, action);

    switch (provider) {
      case 'anthropic':
        return {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        };
      default:
        // OpenAI and xAI use similar format
        return {
          model: provider === 'xai' ? 'grok-4.6' : 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.7,
        };
    }
  }

  private getComposePayload(provider: AIProvider, prompt: string): any {
    const systemPrompt = 'You are a helpful writing assistant. Generate a draft document based on the user\'s description. Write clear, well-structured markdown content. Return only the draft content, no meta-commentary.';
    const userPrompt = `Write a draft document for: ${prompt}`;

    switch (provider) {
      case 'anthropic':
        return {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        };
      default:
        return {
          model: provider === 'xai' ? 'grok-4.6' : 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.7,
        };
    }
  }

  private extractResult(provider: AIProvider, data: any): string {
    switch (provider) {
      case 'anthropic':
        return data.content?.[0]?.text || '';
      default:
        return data.choices?.[0]?.message?.content || '';
    }
  }

  private getSystemPrompt(action: AIAction): string {
    switch (action) {
      case 'rewrite':
        return 'You are a helpful writing assistant. Rewrite the user\'s text to improve clarity and style. Return only the rewritten text, no explanations.';
      case 'shorten':
        return 'You are a helpful writing assistant. Shorten the user\'s text while preserving key information. Return only the shortened text, no explanations.';
      case 'outline':
        return 'You are a helpful writing assistant. Convert the user\'s text into a structured outline. Return only the outline, no explanations.';
      case 'extract-decisions':
        return 'You are a helpful writing assistant. Extract key decisions from the user\'s text and format them under a "## Decisions" heading. Return only the decisions section.';
      default:
        return 'You are a helpful writing assistant.';
    }
  }

  private getUserPrompt(text: string, action: AIAction): string {
    switch (action) {
      case 'rewrite':
        return `Rewrite this text for clarity:\n\n${text}`;
      case 'shorten':
        return `Shorten this text:\n\n${text}`;
      case 'outline':
        return `Convert this text into an outline:\n\n${text}`;
      case 'extract-decisions':
        return `Extract key decisions from this text and format under "## Decisions":\n\n${text}`;
      default:
        return text;
    }
  }

  private generateMockResponse(text: string, action: AIAction): string {
    switch (action) {
      case 'rewrite':
        return `[MOCK REWRITE FOR CLARITY] ${text.charAt(0).toUpperCase()}${text.slice(1)}`;
      case 'shorten':
        return `[MOCK SHORTEN] ${text.slice(0, Math.floor(text.length / 2))}...`;
      case 'outline':
        return `[MOCK OUTLINE]\n- ${text.split('.')[0]}\n- ${text.split('.')[1] || 'Point 2'}`;
      case 'extract-decisions':
        return `[MOCK EXTRACT]\n\n## Decisions\n\n- Decision extracted from: ${text.slice(0, 50)}...`;
      default:
        return `[MOCK RESPONSE] ${text}`;
    }
  }

  private generateMockCompose(prompt: string): string {
    return `# ${prompt.charAt(0).toUpperCase()}${prompt.slice(1)}\n\n[MOCK COMPOSE] This is a draft document based on your prompt: "${prompt}"\n\n## Introduction\n\nThis section introduces the topic.\n\n## Main Content\n\nHere is the main content of the draft.\n\n## Conclusion\n\nThis concludes the draft.`;
  }
}
