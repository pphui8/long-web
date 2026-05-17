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

    const tempUserId = Date.now().toString();
    const newUserMessage: Message = {
      id: tempUserId,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newUserMessage]
    }));

    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), initialAssistantMessage]
    }));

    try {
      const cid = !isNaN(Number(activeId)) ? activeId : undefined;
      
      await chatService.streamMessage(content, cid, {
        onChunk: (chunk) => {
          setMessages(prev => {
            const currentMessages = prev[activeId] || [];
            return {
              ...prev,
              [activeId]: currentMessages.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            };
          });
        },
        onDone: async (newConversationId) => {
          setIsLoading(false);
          
          if (!cid && newConversationId) {
            const newConvId = newConversationId.toString();
            
            setMessages(prev => {
              const newMsgs = { ...prev };
              newMsgs[newConvId] = newMsgs[activeId];
              delete newMsgs[activeId];
              return newMsgs;
            });

            setActiveId(newConvId);
            
            const updatedConvs = await chatService.getConversations();
            setConversations(updatedConvs);
          }
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          setMessages(prev => {
            const currentMessages = prev[activeId] || [];
            return {
              ...prev,
              [activeId]: currentMessages.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: msg.content + '\n\n[Error: ' + error + ']' }
                  : msg
              )
            };
          });
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      // If it's a numeric ID (backend), call the API
      if (!isNaN(Number(id))) {
        await chatService.deleteConversation(id);
      }
      
      // Update conversations first and determine new active ID if needed
      setConversations(prev => {
        const newConvs = prev.filter(c => c.id !== id);
        
        // If we deleted the active conversation, pick a new one
        if (activeId === id) {
          if (newConvs.length > 0) {
            setActiveId(newConvs[0].id);
          } else {
            setActiveId(null);
          }
        }
        
        return newConvs;
      });

      // Clean up messages
      setMessages(prev => {
        const newMsgs = { ...prev };
        delete newMsgs[id];
        return newMsgs;
      });
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation. Please try again.');
    }
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
        onDeleteConversation={handleDeleteConversation}
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
