export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: number;
}

export interface User {
  username: string;
  avatar?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
