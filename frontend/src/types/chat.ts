export type LLMProvider = 'openai' | 'gemini' | 'mistral' | 'rule-based' | 'fallback';
export type LLMProviderWithAuto = LLMProvider | 'auto';

export interface ChatMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  provider?: LLMProvider;
}

export interface ChatResponse {
  message: string;
  sources?: string[];
  confidence?: number;
  provider?: LLMProvider;
  metadata?: {
    error?: boolean;
    originalError?: string;
    cachedAt?: number;
    [key: string]: any;
  };
  processing_time?: number;
  error?: string | null;
}
