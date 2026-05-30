import React, { useState } from 'react';
import type { Conversation } from '../../types';
import authService from '../../authService';

interface SidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  username: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  username,
  isOpen,
  onClose
}) => {
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const closeDeleteDialog = () => {
    setConversationToDelete(null);
  };

  const confirmDeleteConversation = () => {
    if (!conversationToDelete) {
      return;
    }

    onDeleteConversation(conversationToDelete.id);
    closeDeleteDialog();
  };

  return (
    <>
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-sidebar-bg text-sidebar-text flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 flex justify-between items-center">
          <button 
            className="flex-1 flex items-center gap-3 px-4 py-2 bg-transparent border border-slate-600 rounded-md text-sm hover:bg-sidebar-hover transition-colors text-left"
            onClick={onNewChat}
          >
            <span className="text-lg">+</span> New Chat
          </button>
          <button 
            className="md:hidden ml-2 p-2 text-white hover:bg-sidebar-hover rounded-md" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Recent Conversations
            </h3>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors group relative
                  ${activeId === conv.id ? 'bg-sidebar-hover' : 'hover:bg-sidebar-hover/50'}
                `}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex justify-between items-start pr-6">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{conv.title}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-slate-700/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConversationToDelete(conv);
                  }}
                  title="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-sm">
              {username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{username}</div>
            </div>
          </div>
          <button 
            className="w-full py-2 bg-transparent border border-red-500 text-red-500 rounded-md text-sm hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            onClick={() => void authService.logout()}
          >
            Logout
          </button>
        </div>
      </aside>

      {conversationToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-conversation-title"
          onClick={closeDeleteDialog}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-conversation-title" className="text-base font-semibold text-slate-950">
                  Delete conversation?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently delete "{conversationToDelete.title}".
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={closeDeleteDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                onClick={confirmDeleteConversation}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
