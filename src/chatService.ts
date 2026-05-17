import api, { TOKEN_KEY } from './api';
import type { Message, Conversation } from './types';

export interface LLMRequest {
  conversation_id?: number;
  prompt: string;
}

export interface LLMResponse {
  conversation_id: number;
  message: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (conversationId: number) => void;
  onError: (error: string) => void;
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

  async streamMessage(prompt: string, conversationId: string | number | undefined, callbacks: StreamCallbacks): Promise<void> {
    const data: LLMRequest = {
      prompt,
      conversation_id: conversationId && !isNaN(Number(conversationId)) ? Number(conversationId) : undefined,
    };

    const token = localStorage.getItem(TOKEN_KEY);
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (currentEvent === 'done') {
              try {
                const doneData = JSON.parse(data);
                if (doneData.conversation_id) {
                  callbacks.onDone(doneData.conversation_id);
                }
              } catch (e) {
                console.error('Failed to parse done event data', e);
              }
            } else if (currentEvent === 'error') {
              callbacks.onError(data);
            } else {
              callbacks.onChunk(data);
            }
          } else if (line === '') {
            currentEvent = '';
          }
        }
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error.message : String(error));
    }
  },

  async deleteConversation(conversationId: string | number): Promise<void> {
    await api.get(`/conversations/${conversationId}/delete`);
  },
};

export default chatService;
