import { apiService } from './api';
import { ChatMessage, LLMProvider, LLMProviderWithAuto, ChatResponse } from '../types/chat';

/**
 * Enhanced Chat Service
 * Handles all chat-related API interactions with advanced features
 */
class ChatService {
  private cache = new Map<string, ChatResponse>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Send a message to the AI assistant
   */
  async sendMessage(
    content: string,
    provider?: LLMProviderWithAuto,
    apiKeys?: Record<string, string>,
    context?: Record<string, any>
  ): Promise<ChatResponse> {
    try {
      // Create cache key
      const cacheKey = this.createCacheKey(content, provider, apiKeys);
      
      // Check cache first
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Send request to API with auto-selection support
      const requestProvider = provider === 'auto' ? 'auto' : provider;
      const response = await apiService.sendMessage(content, requestProvider, apiKeys);
      
      // Validate response
      const validatedResponse = this.validateResponse(response);
      
      // Add auto-selection metadata if applicable
      if (provider === 'auto' || !provider) {
        validatedResponse.metadata = {
          ...validatedResponse.metadata,
          autoSelected: true,
          selectionReason: this.getSelectionReason(content, validatedResponse.provider || 'unknown')
        };
      }
      
      // Cache the response
      this.setCache(cacheKey, validatedResponse);
      
      return validatedResponse;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chat service error:', error);
      }
      
      // Return fallback response
      return this.createFallbackResponse(error);
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(userId?: string): Promise<ChatMessage[]> {
    try {
      const history = await apiService.getChatHistory(userId);
      return this.validateChatHistory(history);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching chat history:', error);
      }
      return [];
    }
  }

  /**
   * Clear chat history (client-side cache)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get available providers from backend
   */
  async getAvailableProviders(): Promise<string[]> {
    try {
      const health = await apiService.healthCheck();
      return health.providers || [];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching providers:', error);
      }
      return [];
    }
  }

  /**
   * Test API connection and provider availability
   */
  async testConnection(): Promise<{
    connected: boolean;
    providers: string[];
    latency: number;
  }> {
    const startTime = Date.now();
    
    try {
      const health = await apiService.healthCheck();
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        providers: health.providers || [],
        latency
      };
    } catch (error) {
      return {
        connected: false,
        providers: [],
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Stream message (for future implementation)
   */
  async streamMessage(
    content: string,
    onChunk: (chunk: string) => void,
    provider?: LLMProvider,
    apiKeys?: Record<string, string>
  ): Promise<void> {
    // Placeholder for streaming implementation
    // This would use Server-Sent Events or WebSockets
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Streaming not yet implemented, falling back to regular message');
    }
    
    const response = await this.sendMessage(content, provider, apiKeys);
    
    // Simulate streaming by chunking the response
    const words = response.message.split(' ');
    for (let i = 0; i < words.length; i++) {
      setTimeout(() => {
        onChunk(words.slice(0, i + 1).join(' '));
      }, i * 50);
    }
  }

  /**
   * Export chat history
   */
  async exportChatHistory(format: 'json' | 'txt' | 'csv' = 'json'): Promise<string> {
    try {
      const history = await this.getChatHistory();
      
      switch (format) {
        case 'json':
          return JSON.stringify(history, null, 2);
        
        case 'txt':
          return history
            .map(msg => `[${msg.timestamp}] ${msg.role}: ${msg.content}`)
            .join('\n\n');
        
        case 'csv':
          const csvHeader = 'timestamp,role,content,provider\n';
          const csvRows = history
            .map(msg => `"${msg.timestamp}","${msg.role}","${msg.content.replace(/"/g, '""')}","${msg.provider || ''}"`)
            .join('\n');
          return csvHeader + csvRows;
        
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error exporting chat history:', error);
      }
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  async getChatStats(): Promise<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    averageResponseTime: number;
    providerUsage: Record<string, number>;
  }> {
    try {
      const history = await this.getChatHistory();
      
      const userMessages = history.filter(msg => msg.role === 'user').length;
      const assistantMessages = history.filter(msg => msg.role === 'assistant').length;
      
      const providerUsage: Record<string, number> = {};
      history.forEach(msg => {
        if (msg.provider) {
          providerUsage[msg.provider] = (providerUsage[msg.provider] || 0) + 1;
        }
      });
      
      return {
        totalMessages: history.length,
        userMessages,
        assistantMessages,
        averageResponseTime: 0, // Would need to track this separately
        providerUsage
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting chat stats:', error);
      }
      return {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        averageResponseTime: 0,
        providerUsage: {}
      };
    }
  }

  // Private methods

  private createCacheKey(
    content: string,
    provider?: LLMProviderWithAuto,
    apiKeys?: Record<string, string>
  ): string {
    const keyData = {
      content: content.trim().toLowerCase(),
      provider: provider || 'auto',
      hasApiKeys: apiKeys ? Object.keys(apiKeys).sort().join(',') : ''
    };
    
    return btoa(JSON.stringify(keyData));
  }

  private getFromCache(key: string): ChatResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if cache entry is still valid
    const now = Date.now();
    if (cached.metadata?.cachedAt && now - cached.metadata.cachedAt > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  private setCache(key: string, response: ChatResponse): void {
    // Implement LRU cache behavior
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Add cache metadata
    const cachedResponse = {
      ...response,
      metadata: {
        ...response.metadata,
        cachedAt: Date.now()
      }
    };
    
    this.cache.set(key, cachedResponse);
  }

  private validateResponse(response: any): ChatResponse {
    // Ensure response has required fields
    return {
      message: response.message || 'No response received',
      provider: response.provider || 'unknown',
      confidence: Math.max(0, Math.min(1, response.confidence || 0)),
      sources: Array.isArray(response.sources) ? response.sources : [],
      metadata: response.metadata || {},
      processing_time: response.processing_time || 0,
      error: response.error || null
    };
  }

  private validateChatHistory(history: any[]): ChatMessage[] {
    if (!Array.isArray(history)) return [];
    
    return history
      .filter(msg => msg && typeof msg === 'object')
      .map(msg => ({
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        content: msg.content || '',
        role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        timestamp: msg.timestamp || new Date().toISOString(),
        user_id: msg.user_id || 'unknown',
        provider: msg.provider || undefined
      }));
  }

  private getSelectionReason(content: string, selectedProvider: string): string {
    const contentLower = content.toLowerCase();
    
    // Determine why this provider was selected
    if (selectedProvider === 'openai') {
      if (contentLower.includes('contract') || contentLower.includes('legal') || contentLower.includes('document')) {
        return 'Selected for legal document analysis expertise';
      }
      return 'Selected for reliable general-purpose AI assistance';
    } else if (selectedProvider === 'gemini') {
      if (contentLower.includes('explain') || contentLower.includes('analyze') || contentLower.includes('complex')) {
        return 'Selected for complex reasoning and analysis';
      }
      if (contentLower.includes('code') || contentLower.includes('programming')) {
        return 'Selected for code-related queries';
      }
      return 'Selected for advanced reasoning capabilities';
    } else if (selectedProvider === 'mistral') {
      if (content.split(' ').length < 10) {
        return 'Selected for quick response to simple queries';
      }
      return 'Selected for efficient processing';
    }
    
    return `Auto-selected ${selectedProvider} as the best available option`;
  }

  private createFallbackResponse(error: any): ChatResponse {
    let message = 'I apologize, but I\'m experiencing technical difficulties. ';
    
    if (error?.status === 429) {
      message += 'Please wait a moment before sending another message.';
    } else if (error?.status >= 500) {
      message += 'The server is temporarily unavailable. Please try again later.';
    } else if (error?.code === 'NETWORK_ERROR') {
      message += 'Please check your internet connection and try again.';
    } else {
      message += 'Please try again or contact support if the problem persists.';
    }
    
    return {
      message,
      provider: 'fallback',
      confidence: 0,
      sources: [],
      metadata: {
        error: true,
        originalError: error?.message || 'Unknown error'
      },
      processing_time: 0,
      error: 'fallback_response'
    };
  }
}

// Create and export singleton instance
const chatService = new ChatService();
export default chatService;

// Export the class for testing
export { ChatService };