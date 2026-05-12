import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatWindow } from './ChatWindow';
import type { Message, Conversation } from '../../types';
import chatService from '../../chatService';

interface ChatLayoutProps {
  username: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ username }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(data);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages when activeId changes
  useEffect(() => {
    if (!activeId || messages[activeId]) return;

    const fetchMessages = async () => {
      try {
        const data = await chatService.getMessages(activeId);
        setMessages(prev => ({ ...prev, [activeId]: data }));
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    // If it's a numeric ID (from backend), fetch it. 
    // If it's a temporary string ID (from handleNewChat), don't fetch.
    if (!isNaN(Number(activeId))) {
      fetchMessages();
    }
  }, [activeId]);

  const activeMessages = activeId ? (messages[activeId] || []) : [];

  const handleSendMessage = async (content: string) => {
    if (!activeId) return;

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage]
    }));

    setIsLoading(true);

    try {
      // If activeId is not a number, it's a new conversation
      const cid = !isNaN(Number(activeId)) ? activeId : undefined;
      const res = await chatService.sendMessage(content, cid);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.message,
        timestamp: Date.now(),
      };

      // Update messages for the current activeId
      setMessages(prev => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), assistantMessage]
      }));

      // If it was a new conversation, update the activeId and conversations list
      if (!cid && res.conversation_id) {
        const newConvId = res.conversation_id.toString();
        
        // Move messages from temp activeId to the new real ID
        setMessages(prev => {
          const newMsgs = { ...prev };
          newMsgs[newConvId] = newMsgs[activeId];
          delete newMsgs[activeId];
          return newMsgs;
        });

        setActiveId(newConvId);
        
        // Refresh conversations to get the title etc.
        const updatedConvs = await chatService.getConversations();
        setConversations(updatedConvs);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please check your connection and try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    const newId = `new-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      updatedAt: Date.now(),
    };
    // Don't add to conversations list yet, wait for first message? 
    // Or add it as a placeholder.
    setConversations([newConv, ...conversations]);
    setActiveId(newId);
    setMessages({ ...messages, [newId]: [] });
    setIsSidebarOpen(false);
  };

  const activeTitle = conversations.find(c => c.id === activeId)?.title || 'Chat';

  return (
    <div className="flex h-screen w-full relative">
      {isSidebarOpen && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 z-40" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar
        conversations={conversations}
        activeId={activeId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        username={username}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col bg-white min-w-0">
        <ChatWindow
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          title={activeTitle}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </main>
    </div>
  );
};

export default ChatLayout;
