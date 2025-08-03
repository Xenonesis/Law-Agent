export interface ApiKeys {
  gemini: string;
  mistral: string;
  claude: string;
  openai: string;
  openrouter: string;
  lmstudio: string;
  ollama: string;
}

export interface ApiKeyConfig {
  key: keyof ApiKeys;
  label: string;
  placeholder: string;
  description: string;
  required?: boolean;
}

export const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    key: 'openai',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    description: 'Required for GPT models (GPT-3.5, GPT-4, etc.)'
  },
  {
    key: 'claude',
    label: 'Claude API Key',
    placeholder: 'sk-ant-...',
    description: 'Required for Anthropic Claude models'
  },
  {
    key: 'gemini',
    label: 'Google Gemini API Key',
    placeholder: 'AI...',
    description: 'Required for Google Gemini models'
  },
  {
    key: 'mistral',
    label: 'Mistral API Key',
    placeholder: 'api_key...',
    description: 'Required for Mistral AI models'
  },
  {
    key: 'openrouter',
    label: 'OpenRouter API Key',
    placeholder: 'sk-or-...',
    description: 'Access to multiple models through OpenRouter'
  },
  {
    key: 'lmstudio',
    label: 'LM Studio API Key',
    placeholder: 'lm-studio-...',
    description: 'For local LM Studio server (usually not required)'
  },
  {
    key: 'ollama',
    label: 'Ollama API Key',
    placeholder: 'ollama-...',
    description: 'For local Ollama server (usually not required)'
  }
];

const STORAGE_KEY = 'lawyer-bot-api-keys';

export class ApiKeyService {
  static getApiKeys(): ApiKeys {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading API keys from storage:', error);
      }
    }
    
    // Return default empty keys
    return {
      gemini: '',
      mistral: '',
      claude: '',
      openai: '',
      openrouter: '',
      lmstudio: '',
      ollama: ''
    };
  }

  static saveApiKeys(apiKeys: ApiKeys): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys));
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving API keys to storage:', error);
      }
      return false;
    }
  }

  static clearApiKeys(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error clearing API keys from storage:', error);
      }
      return false;
    }
  }

  static validateApiKey(provider: keyof ApiKeys, key: string): boolean {
    if (!key.trim()) return false;
    
    // Basic validation patterns for different providers
    const patterns: Record<keyof ApiKeys, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      claude: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
      gemini: /^AI[a-zA-Z0-9-_]{35,}$/,
      mistral: /^[a-zA-Z0-9]{32,}$/,
      openrouter: /^sk-or-[a-zA-Z0-9-_]{48,}$/,
      lmstudio: /.+/, // More flexible for local servers
      ollama: /.+/ // More flexible for local servers
    };

    return patterns[provider]?.test(key) || false;
  }

  static maskApiKey(key: string): string {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  }
}
