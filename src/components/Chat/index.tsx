import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatWindow } from './ChatWindow';
import type { Message, Conversation } from '../../types';
import api from '../../api';

interface ChatLayoutProps {
  username: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ username }) => {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'Getting Started', updatedAt: Date.now() },
    { id: '2', title: 'Domain Specific Query', updatedAt: Date.now() - 86400000 },
  ]);
  const [activeId, setActiveId] = useState<string>('1');
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      { id: 'm1', role: 'assistant', content: 'Hello! I am your domain-specific AI assistant. How can I help you today?', timestamp: Date.now() - 100000 },
    ],
    '2': [
      { id: 'm2', role: 'user', content: 'What are the main functions of this domain?', timestamp: Date.now() - 90000000 },
      { id: 'm3', role: 'assistant', content: 'This domain specializes in long-form content analysis and generation.', timestamp: Date.now() - 89900000 },
    ]
  });
  const [isLoading, setIsLoading] = useState(false);

  const activeMessages = messages[activeId] || [];

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
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
      // Mimic LLM API call
      // In a real app, you would call api.post('/chat', { message: content, conversationId: activeId })
      const res = await api.get('/ping'); // Just to verify connectivity and JWT
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${content}". This is a placeholder response from the domain-specific LLM. (Backend connectivity verified: ${res.status === 200 ? 'OK' : 'Error'})`,
        timestamp: Date.now(),
      };

      setMessages(prev => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), assistantMessage]
      }));
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

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      updatedAt: Date.now(),
    };
    setConversations([newConv, ...conversations]);
    setActiveId(newId);
    setMessages({ ...messages, [newId]: [] });
  };

  const activeTitle = conversations.find(c => c.id === activeId)?.title || 'Chat';

  return (
    <div className="chat-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        onNewChat={handleNewChat}
        username={username}
      />
      <main className="chat-main">
        <ChatWindow
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          title={activeTitle}
        />
      </main>
    </div>
  );
};

export default ChatLayout;
