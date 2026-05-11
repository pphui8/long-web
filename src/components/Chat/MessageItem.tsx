import React from 'react';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={`flex gap-4 max-w-[85%] ${isAssistant ? '' : 'flex-row-reverse self-end'}`}>
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
        ${isAssistant ? 'bg-slate-200 text-sidebar-bg' : 'bg-primary text-white'}
      `}>
        {isAssistant ? 'AI' : 'U'}
      </div>
      <div className={`flex flex-col gap-1 ${isAssistant ? '' : 'items-end'}`}>
        <div className={`flex items-center gap-2 text-xs text-text-muted ${isAssistant ? '' : 'flex-row-reverse'}`}>
          <span className="font-semibold text-slate-700">{isAssistant ? 'Assistant' : 'You'}</span>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`
          px-4 py-3 rounded-2xl text-[15px] leading-relaxed break-words
          ${isAssistant 
            ? 'bg-message-ai-bg text-message-ai-text rounded-tl-none border border-slate-100' 
            : 'bg-message-user-bg text-message-user-text rounded-tr-none shadow-sm'}
        `}>
          {message.content}
        </div>
      </div>
    </div>
  );
};
