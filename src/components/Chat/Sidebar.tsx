import React from 'react';
import type { Conversation } from '../../types';
import authService from '../../authService';

interface SidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  username: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  username,
  isOpen,
  onClose
}) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>+</span> New Chat
        </button>
        <button className="close-sidebar-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="conversation-list">
          <h3>Recent Conversations</h3>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conv-title">{conv.title}</div>
              <div className="conv-date">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{username[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="username">{username}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={() => authService.logout()}>
          Logout
        </button>
      </div>
    </div>
  );
};
