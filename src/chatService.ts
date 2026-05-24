import api, { getAccessToken, refreshAccessToken } from './api';
import type { Message, Conversation } from './types';

export type ChatModel = 'gemini';

export const DEFAULT_CHAT_MODEL: ChatModel = 'gemini';

export interface LLMRequest {
  model: ChatModel;
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

interface BackendConversation {
  id: number;
  username: string;
  title: string;
  summary: string;
  created_at: string;
  last_message_at: string;
}

interface BackendMessage {
  id: number;
  conversation_id: number;
  role: Message['role'];
  content: string;
  token_count: number;
  created_at: string;
}

type ApiDataResponse<T> = T | {
  data: T;
};

interface SseEvent {
  event: string;
  data: string;
}

const toConversation = (conversation: BackendConversation): Conversation => ({
  id: String(conversation.id),
  title: conversation.title || 'Untitled conversation',
  updatedAt: new Date(conversation.last_message_at || conversation.created_at).getTime(),
});

const toMessage = (message: BackendMessage): Message => ({
  id: String(message.id),
  role: message.role,
  content: message.content,
  timestamp: new Date(message.created_at).getTime(),
});

const getApiUrl = (path: string) => {
  const baseURL = api.defaults.baseURL || '';
  return `${baseURL}${path}`;
};

const parseSseEvent = (rawEvent: string): SseEvent | null => {
  const lines = rawEvent.split('\n');
  let event = 'message';
  const data: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      data.push(line.slice('data:'.length).replace(/^ /, ''));
    }
  }

  if (data.length === 0 && event === 'message') {
    return null;
  }

  return { event, data: data.join('\n') };
};

const parseErrorMessage = (payload: unknown, fallback: string) => {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return fallback;
};

const unwrapData = <T>(payload: ApiDataResponse<T>): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload
  ) {
    return payload.data;
  }

  return payload;
};

const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<ApiDataResponse<BackendConversation[]>>('/conversations');
    return unwrapData(response.data).map(toConversation);
  },

  async getMessages(conversationId: string | number): Promise<Message[]> {
    const response = await api.get<ApiDataResponse<BackendMessage[]>>(`/conversations/${conversationId}/messages`);
    return unwrapData(response.data).map(toMessage);
  },

  async sendMessage(
    prompt: string,
    conversationId?: string | number,
    model: ChatModel = DEFAULT_CHAT_MODEL,
  ): Promise<LLMResponse> {
    const data: LLMRequest = {
      model,
      prompt,
      conversation_id: conversationId ? Number(conversationId) : undefined,
    };
    const response = await api.post<LLMResponse>('/chat', data);
    return response.data;
  },

  async streamMessage(
    prompt: string,
    conversationId: string | number | undefined,
    callbacks: StreamCallbacks,
    model: ChatModel = DEFAULT_CHAT_MODEL,
  ): Promise<void> {
    const data: LLMRequest = {
      model,
      prompt,
      conversation_id: conversationId && !isNaN(Number(conversationId)) ? Number(conversationId) : undefined,
    };

    try {
      let token = getAccessToken();
      if (!token) {
        token = await refreshAccessToken();
      }

      const response = await fetch(getApiUrl('/chat'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let message = 'Chat request failed';
        try {
          const payload = await response.json();
          message = parseErrorMessage(payload, message);
        } catch {
          message = `Chat request failed with status ${response.status}`;
        }
        throw new Error(message);
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

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

        let boundaryIndex;
        while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          const event = parseSseEvent(rawEvent);
          if (!event) continue;

          if (event.event === 'done') {
            const payload = JSON.parse(event.data);
            const newConversationId = payload.data?.conversation_id;
            if (newConversationId) {
              callbacks.onDone(newConversationId);
            }
          } else if (event.event === 'error') {
            const payload = JSON.parse(event.data);
            callbacks.onError(parseErrorMessage(payload, 'Stream error'));
          } else {
            callbacks.onChunk(event.data);
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
