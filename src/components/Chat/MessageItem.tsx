import React from 'react';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={`message-item ${message.role}`}>
      <div className="message-avatar">
        {isAssistant ? 'AI' : 'U'}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-author">{isAssistant ? 'Assistant' : 'You'}</span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="message-text">{message.content}</div>
      </div>
    </div>
  );
};
