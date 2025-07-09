import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, ThumbsUp, ThumbsDown, RotateCcw, FileText, Code, Zap } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AIMessage, CodeBlock } from '../../types/ai';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const {
    activeSession,
    isLoading,
    sendMessage,
    clearMessages
  } = useAI();

  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput('');
    setAttachedFiles([]);

    await sendMessage(messageContent, attachedFiles);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const quickPrompts = [
    { label: 'Review this code', prompt: 'Please review this code for best practices, performance, and security issues.', icon: Code },
    { label: 'Generate tests', prompt: 'Generate comprehensive unit tests for this component.', icon: FileText },
    { label: 'Optimize performance', prompt: 'How can I optimize the performance of this code?', icon: Zap },
    { label: 'Add error handling', prompt: 'Add proper error handling and validation to this code.', icon: FileText }
  ];

  const renderMessage = (message: AIMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : isSystem
                ? isDark ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-600/20' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : isDark ? 'bg-gray-700 text-gray-100 rounded-bl-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}>
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
            
            {/* Render code blocks */}
            {message.metadata?.codeBlocks?.map((codeBlock, index) => (
              <div key={index} className="mt-3">
                <div className={`rounded-lg overflow-hidden border ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <div className={`flex items-center justify-between px-3 py-2 text-xs ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    <span className="font-medium">{codeBlock.language}</span>
                    <button
                      onClick={() => copyToClipboard(codeBlock.code)}
                      className="flex items-center gap-1 hover:text-blue-500"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                  </div>
                  <pre className={`p-3 overflow-x-auto text-sm font-mono ${
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                  }`}>
                    <code>{codeBlock.code}</code>
                  </pre>
                  {codeBlock.explanation && (
                    <div className={`px-3 py-2 text-xs border-t ${
                      isDark ? 'border-gray-600 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}>
                      {codeBlock.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {message.metadata?.tokens && (
              <span className={`text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {message.metadata.tokens} tokens
              </span>
            )}
            
            {!isUser && !isSystem && (
              <div className="flex items-center gap-1">
                <button className={`p-1 rounded transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}>
                  <ThumbsUp size={12} />
                </button>
                <button className={`p-1 rounded transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}>
                  <ThumbsDown size={12} />
                </button>
                <button 
                  onClick={() => copyToClipboard(message.content)}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <Copy size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-gray-600' : 'bg-gray-300'
          }`}>
            <span className="text-sm font-medium">U</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Zap size={24} className="text-white" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>AI Development Assistant</h3>
            <p className={`text-sm text-center mb-6 max-w-md ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Get help with code generation, debugging, optimization, and more. Ask me anything about your project!
            </p>
            
            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt.prompt)}
                  className={`p-3 rounded-lg text-left transition-colors border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <prompt.icon size={14} />
                    <span className="font-medium text-xs">{prompt.label}</span>
                  </div>
                  <p className="text-xs opacity-75">{prompt.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            
            {isLoading && (
              <div className="flex gap-3 justify-start mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap size={16} className="text-white" />
                </div>
                <div className={`rounded-2xl rounded-bl-sm px-4 py-3 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className={`border-t p-4 ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <FileText size={12} />
                  <span>{file}</span>
                  <button
                    onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your code or project..."
              className={`w-full resize-none rounded-lg px-4 py-2 pr-12 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none`}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                  }`}
                  title="Clear conversation"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </div>
        
        <div className={`flex items-center justify-between mt-2 text-xs ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span>Press Enter to send, Shift+Enter for new line</span>
          {activeSession && (
            <span>
              {activeSession.tokenUsage.total} tokens used
            </span>
          )}
        </div>
      </div>
    </div>
  );
};