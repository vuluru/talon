import { getApiKey } from './settings';

export interface AIResponse {
  text: string;
  isMock: boolean;
}

export type AIAction = 'rewrite' | 'shorten' | 'outline' | 'extract-decisions';

export class AIService {
  async processText(text: string, action: AIAction = 'rewrite'): Promise<AIResponse> {
    const apiKey = getApiKey();

    if (!apiKey) {
      // Return mock response
      return {
        text: this.generateMockResponse(text, action),
        isMock: true,
      };
    }

    // Try to call real API if key is present
    try {
      const systemPrompt = this.getSystemPrompt(action);
      const userPrompt = this.getUserPrompt(text, action);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
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
        }),
      });

      if (!response.ok) {
        console.error('API error:', response.status);
        return {
          text: this.generateMockResponse(text, action),
          isMock: true,
        };
      }

      const data = await response.json();
      return {
        text: data.choices[0]?.message?.content || text,
        isMock: false,
      };
    } catch (error) {
      console.error('Failed to call AI API:', error);
      return {
        text: this.generateMockResponse(text, action),
        isMock: true,
      };
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
        return `Rewrite this text:\n\n${text}`;
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
        return `[MOCK REWRITE] ${text.charAt(0).toUpperCase()}${text.slice(1)}`;
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
}
