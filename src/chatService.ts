import api from './api';
import type { Message, Conversation } from './types';

export interface LLMRequest {
  conversation_id?: number;
  prompt: string;
}

export interface LLMResponse {
  conversation_id: number;
  message: string;
}

const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/conversations');
    return response.data;
  },

  async getMessages(conversationId: string | number): Promise<Message[]> {
    const response = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessage(prompt: string, conversationId?: string | number): Promise<LLMResponse> {
    const data: LLMRequest = {
      prompt,
      conversation_id: conversationId ? Number(conversationId) : undefined,
    };
    const response = await api.post<LLMResponse>('/gemini', data);
    return response.data;
  },
};

export default chatService;
