import api from './api';
import { ChatMessage, ChatResponse } from '../types/chat';
import { LLMProvider } from '../types/chat';
import { ApiKeyService } from './apiKeyService';

const chatService = {
  // Send a message to the chat API
  sendMessage: async (content: string, provider?: LLMProvider): Promise<ChatResponse> => {
    try {
      console.log('Sending message to API:', content);
      // Log the full URL for debugging
      console.log('API URL:', api.defaults.baseURL + '/api/chat/send');

      // Get API keys from settings
      const apiKeys = ApiKeyService.getApiKeys();
      
      const response = await api.post<ChatResponse>('/api/chat/send', {
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        provider: provider,
        api_keys: apiKeys
      });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      // Return a fallback response for testing
      return {
        message: "This is a fallback response. The server might be unavailable or the endpoint is incorrect.",
        provider: "fallback"
      };
    }
  },

  // Get chat history
  getChatHistory: async (limit: number = 50): Promise<ChatMessage[]> => {
    try {
      console.log('Getting chat history, limit:', limit);
      // Log the full URL for debugging
      console.log('API URL:', api.defaults.baseURL + '/api/chat/history');

      const response = await api.get<ChatMessage[]>('/api/chat/history', {
        params: { limit }
      });
      console.log('History Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      // Return empty array for testing
      return [];
    }
  }
};

export default chatService;
