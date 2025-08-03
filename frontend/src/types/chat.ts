export type LLMProvider = 'openai' | 'gemini' | 'mistral' | 'rule-based' | 'fallback';

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
}
