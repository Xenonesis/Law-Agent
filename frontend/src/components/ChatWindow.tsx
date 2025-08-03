import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  isLatest?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isLatest = false }) => {
  const isUser = message.role === 'user';
  const isFallback = message.provider === 'fallback';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return <Sparkles className="w-3 h-3" />;
      case 'gemini':
        return <Bot className="w-3 h-3" />;
      case 'mistral':
        return <Bot className="w-3 h-3" />;
      case 'fallback':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Bot className="w-3 h-3" />;
    }
  };

  const getProviderBadgeClass = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'provider-badge-openai';
      case 'gemini':
        return 'provider-badge-gemini';
      case 'mistral':
        return 'provider-badge-mistral';
      case 'fallback':
        return 'provider-badge-fallback';
      default:
        return 'provider-badge-auto';
    }
  };

  return (
    <div className={`flex w-full my-3 ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className="flex items-start space-x-3 max-w-[85%]">
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`
              px-4 py-3 max-w-full
              ${isUser
                ? 'chat-bubble-user'
                : isFallback
                  ? 'chat-bubble-error'
                  : 'chat-bubble-assistant'}
              ${isLatest ? 'animate-slide-up' : ''}
            `}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                      const codeContent = String(children).replace(/\n$/, '');
                      const isInline = !match;
                      
                      return !isInline ? (
                        <div className="relative group">
                          <button
                            onClick={() => copyToClipboard(codeContent, codeId)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            title="Copy code"
                          >
                            {copiedCode === codeId ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <SyntaxHighlighter
                            style={tomorrow as any}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !mt-2 !mb-2"
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 text-primary-800">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-primary-700">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-primary-600">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary-300 pl-4 italic text-neutral-600 my-2">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          <div className={`flex items-center mt-1 space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {!isUser && message.provider && (
              <div className="flex items-center space-x-2">
                <span className={`provider-badge ${getProviderBadgeClass(message.provider)}`}>
                  {getProviderIcon(message.provider)}
                  <span className="ml-1 capitalize">{message.provider}</span>
                </span>
                {/* Show auto-selection indicator */}
                {(message as any).metadata?.autoSelected && (
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                    🤖 Auto-selected
                  </span>
                )}
              </div>
            )}
            <span className="text-xs text-neutral-500">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </span>
            {/* Show selection reason on hover */}
            {!isUser && (message as any).metadata?.selectionReason && (
              <div className="group relative">
                <span className="text-xs text-neutral-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-neutral-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                  {(message as any).metadata.selectionReason}
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-neutral-400 to-neutral-500 flex items-center justify-center shadow-lg">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = [
    "What are my rights as a tenant?",
    "How do I write a will?",
    "What is contract law?",
    "Employment law basics",
    "How to file a small claims case?"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!disabled) {
      onSendMessage(prompt);
    }
  };

  // Adjust height of textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(message.length > 0);
    }, 100);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="border-t border-neutral-200/50 bg-white/80 backdrop-blur-sm">
      {/* Quick Prompts */}
      {message.length === 0 && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={disabled}
                className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end p-4 space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about legal matters..."
            className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[48px] max-h-[120px] bg-white/90 backdrop-blur-sm transition-all duration-200 placeholder:text-neutral-400"
            rows={1}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          {/* Character count for long messages */}
          {message.length > 100 && (
            <div className="absolute bottom-2 right-3 text-xs text-neutral-400">
              {message.length}/2000
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`
            p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${message.trim() && !disabled
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }
          `}
          disabled={!message.trim() || disabled}
          aria-label="Send message"
          title={disabled ? "Please wait..." : "Send message (Enter)"}
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </form>

      {/* Typing indicator */}
      {isTyping && !disabled && (
        <div className="px-4 pb-2">
          <div className="text-xs text-neutral-500 flex items-center">
            <div className="typing-indicator mr-2">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            Preparing your message...
          </div>
        </div>
      )}
    </div>
  );
};

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading = false,
  onSendMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages come in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-neutral-500">
              <h3 className="text-xl font-medium">Welcome to Legal Assistant</h3>
              <p className="mt-2">Start a conversation to get legal assistance</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatBubble key={message.id || index} message={message} />
        ))}

        {isLoading && (
          <div className="flex w-full my-3 justify-start message-enter">
            <div className="flex items-start space-x-3 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              
              <div className="chat-bubble-assistant">
                <div className="flex items-center space-x-2">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                  <span className="text-sm text-neutral-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatWindow;
