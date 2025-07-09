import React, { useState } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Sparkles, Code, Upload, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export const MasterChatAgent: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: "Hello! I'm ChyperAI, your AI development assistant. I can help you with code, debugging, deployment, and project management across all your projects.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
      "I understand your request. Let me help you with that. I can analyze your code, suggest improvements, or help you implement new features.",
      "That's a great question! I can help you troubleshoot this issue. Let me provide you with a solution.",
      "I can definitely assist with that. Here's what I recommend based on best practices and your current project setup.",
      "Perfect! I'll guide you through this step by step. This is a common scenario and I have some proven solutions."
      ];
      
      sendAgentMessage(responses[Math.floor(Math.random() * responses.length)]);
    }, 1500);
  };
  
  const sendAgentMessage = (content: string) => {
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      content: content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 z-50 ${
          isDark 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white group`}
      >
        <MessageCircle size={24} />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Sparkles size={12} className="text-white" />
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 shadow-2xl z-50 transition-all duration-300 rounded-xl overflow-hidden ${
      isDark 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    } ${
      isMinimized ? 'h-14 w-80' : 'h-96 w-80'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b ${
        isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot size={20} className="text-blue-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <h3 className={`text-sm font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>AI Assistant</h3>
          <div className="flex items-center gap-1 text-xs text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 h-72 scrollbar-thin">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'agent' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-xs p-3 rounded-2xl text-sm leading-relaxed ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : isDark 
                        ? 'bg-gray-700 text-gray-100 rounded-bl-sm' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  {message.content}
                  <div className={`text-xs mt-1 opacity-70 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`}>
                    <User size={14} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <div className={`p-3 rounded-2xl rounded-bl-sm ${
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
          </div>

          {/* Input */}
          <div className={`p-3 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask ChyperAI anything..."
                className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none`}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};