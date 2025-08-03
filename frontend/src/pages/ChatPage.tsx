import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, Download, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../components/Layout';
import ChatWindow from '../components/ChatWindow';
import { ChatMessage, LLMProviderWithAuto } from '../types/chat';
import chatService from '../services/chatService';
import { ApiKeyService } from '../services/apiKeyService';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderWithAuto>('auto');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [messageCount, setMessageCount] = useState<number>(0);

  useEffect(() => {
    // Load chat history on component mount
    const fetchChatHistory = async () => {
      try {
        const history = await chatService.getChatHistory();
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Add a welcome message if there's no chat history
          const welcomeMessage: ChatMessage = {
            id: 'welcome-message',
            content: 'Welcome to the Legal Assistant Chat! How can I help you with your legal questions today?',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            provider: 'rule-based'
          };
          setMessages([welcomeMessage]);
        }
        setLoading(false);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching chat history:', error);
        }
        // Add a welcome message even if there's an error
        const welcomeMessage: ChatMessage = {
          id: 'welcome-message',
          content: 'Welcome to the Legal Assistant Chat! How can I help you with your legal questions today?',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          provider: 'rule-based'
        };
        setMessages([welcomeMessage]);
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, []);
  const handleSendMessage = async (content: string) => {
    // Avoid empty messages
    if (!content.trim()) return;

    // Get API keys from settings
    const apiKeys = ApiKeyService.getApiKeys();
    
    // Convert to the format expected by the backend
    const apiKeysForBackend: Record<string, string> = {};
    if (apiKeys.openai) apiKeysForBackend.openai = apiKeys.openai;
    if (apiKeys.gemini) apiKeysForBackend.gemini = apiKeys.gemini;
    if (apiKeys.mistral) apiKeysForBackend.mistral = apiKeys.mistral;
    if (apiKeys.claude) apiKeysForBackend.claude = apiKeys.claude;

    // Determine provider to use (if not auto)
    // When undefined/auto is sent, the backend will use the first available provider
    const providerToUse = selectedProvider !== 'auto' ? selectedProvider : undefined;

    // Create and add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: providerToUse
    };

    // Add user message to chat
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessageCount(prev => prev + 1);
    setSendingMessage(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Sending message to API:', content);
        // eslint-disable-next-line no-console
        console.log('Using API keys from settings:', Object.keys(apiKeysForBackend));
      }

      // Send message to API with provider selection and API keys from settings
      const response = await chatService.sendMessage(content, providerToUse, apiKeysForBackend);

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Received response from API:', response);
      }

      // Add bot response with provider info
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: response.provider
      };

      // Add bot response to chat
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setMessageCount(prev => prev + 1);
      
      // Show success toast
      toast.success(`Response from ${response.provider}`, {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending message:', error);
      }

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        provider: 'fallback'
      };

      // Add error message to chat
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      
      // Show error toast
      toast.error('Failed to send message. Please try again.', {
        duration: 3000,
        position: 'bottom-right',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setMessageCount(0);
      toast.success('Chat cleared successfully', {
        duration: 2000,
        position: 'bottom-right',
      });
    }
  };

  const handleExportChat = () => {
    const chatData = {
      messages,
      exportDate: new Date().toISOString(),
      messageCount,
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `legal-chat-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Chat exported successfully', {
      duration: 2000,
      position: 'bottom-right',
    });
  };

  const handleRefreshChat = async () => {
    setLoading(true);
    try {
      const history = await chatService.getChatHistory();
      setMessages(history);
      toast.success('Chat refreshed', {
        duration: 2000,
        position: 'bottom-right',
      });
    } catch (error) {
      toast.error('Failed to refresh chat', {
        duration: 3000,
        position: 'bottom-right',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Toaster />
      <div className="h-[calc(100vh-180px)] flex flex-col">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Legal Assistant Chat</h1>
                <p className="text-neutral-600 text-sm">
                  {messageCount > 0 ? `${messageCount} messages in this conversation` : 'Start a new conversation'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefreshChat}
                disabled={loading}
                className="btn btn-ghost p-2 hover-lift"
                title="Refresh chat"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleExportChat}
                disabled={messages.length === 0}
                className="btn btn-ghost p-2 hover-lift"
                title="Export chat"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="btn btn-ghost p-2 hover-lift text-red-600 hover:bg-red-50"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn btn-ghost p-2 hover-lift"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card mb-4 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                      <label htmlFor="provider-select" className="text-sm font-medium text-neutral-700">
                        AI Provider:
                      </label>
                    </div>
                    <select
                      id="provider-select"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as LLMProviderWithAuto)}
                      className="input text-sm py-2 min-w-[140px]"
                      disabled={sendingMessage}
                    >
                      <option value="auto">🤖 Smart Auto-select</option>
                      <option value="openai">🧠 OpenAI GPT</option>
                      <option value="gemini">💎 Google Gemini</option>
                      <option value="mistral">⚡ Mistral AI</option>
                    </select>
                  </div>
                  
                  <div className="text-sm text-neutral-500">
                    {selectedProvider === 'auto' 
                      ? 'System will choose the best available provider'
                      : `Using ${selectedProvider} for responses`
                    }
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              {sendingMessage && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>
            
            <div className="text-xs">
              Provider: <span className="font-medium capitalize">{selectedProvider}</span>
              {selectedProvider === 'auto' && (
                <span className="ml-2 text-primary-600">
                  (Smart selection enabled)
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Chat Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <ChatWindow
            messages={messages}
            isLoading={loading || sendingMessage}
            onSendMessage={handleSendMessage}
          />
        </motion.div>

        {/* Enhanced Disclaimer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-amber-600 text-xs font-bold">!</span>
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Legal Disclaimer</p>
              <p className="text-amber-700">
                This chat provides legal information, not legal advice. For advice specific to your situation, 
                please consult with a qualified attorney. The AI responses are for educational purposes only.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ChatPage;
