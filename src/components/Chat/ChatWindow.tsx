import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { MessageItem } from './MessageItem';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  title: string;
  onToggleSidebar?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isLoading,
  title,
  onToggleSidebar
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-b border-border-color flex items-center gap-4 bg-white/80 backdrop-blur-md z-10">
        <button 
          className="md:hidden p-2 text-text-main text-2xl cursor-pointer hover:bg-slate-100 rounded-md transition-colors" 
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <h2 className="min-w-0 flex-1 text-lg font-semibold truncate text-slate-800">{title}</h2>
      </header>
      
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 flex flex-col gap-4 md:gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center space-y-2">
            <h3 className="text-xl font-medium text-slate-600">Start a new conversation</h3>
            <p>Type a message below to begin chatting with the AI.</p>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}
        {isLoading && (
          <div className="p-4">
            <div className="dot-typing"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="shrink-0 p-4 md:p-8 border-t border-border-color bg-white">
        <form onSubmit={handleSubmit} className="flex min-w-0 gap-2 md:gap-4 max-w-4xl mx-auto">
          <textarea
            className="min-w-0 flex-1 px-4 py-3 border border-border-color rounded-xl resize-none text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-14 max-h-48 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="shrink-0 px-5 md:px-8 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
          >
            Send
          </button>
        </form>
        <div className="text-center text-xs text-text-muted mt-4">
          LLM responses can be inaccurate. Verify important information.
        </div>
      </div>
    </div>
  );
};
