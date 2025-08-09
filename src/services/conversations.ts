/**
 * API service for managing chat conversations
 */

import { apiClient } from '@/lib/api';

export interface Message {
  id: number;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  message_metadata?: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  message_count?: number;
  messages?: Message[];
}

export interface ConversationCreate {
  title?: string;
}

export interface ConversationUpdate {
  title?: string;
  is_archived?: boolean;
}

export interface ConversationQueryRequest {
  query: string;
  conversation_id?: number;
  conversation_title?: string;
}

class ConversationService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(includeArchived = false): Promise<Conversation[]> {
    const result = await apiClient.get<Conversation[]>('/conversations', {
      include_archived: includeArchived
    });

    if (result.error) {
      throw new Error(`Failed to fetch conversations: ${result.error}`);
    }

    return result.data || [];
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(conversationId: number): Promise<Conversation> {
    const result = await apiClient.get<Conversation>(`/conversations/${conversationId}`);

    if (result.error) {
      throw new Error(`Failed to fetch conversation: ${result.error}`);
    }

    return result.data!;
  }

  /**
   * Create a new conversation
   */
  async createConversation(conversation: ConversationCreate): Promise<Conversation> {
    const result = await apiClient.post<Conversation>('/conversations', conversation);

    if (result.error) {
      throw new Error(`Failed to create conversation: ${result.error}`);
    }

    return result.data!;
  }

  /**
   * Update a conversation
   */
  async updateConversation(conversationId: number, update: ConversationUpdate): Promise<Conversation> {
    const result = await apiClient.put<Conversation>(`/conversations/${conversationId}`, update);

    if (result.error) {
      throw new Error(`Failed to update conversation: ${result.error}`);
    }

    return result.data!;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: number): Promise<void> {
    const result = await apiClient.delete(`/conversations/${conversationId}`, undefined);

    if (result.error) {
      throw new Error(`Failed to delete conversation: ${result.error}`);
    }
  }

  /**
   * Send a chat message with conversation persistence
   * Returns a ReadableStream for streaming responses
   */
  async sendChatMessage(request: ConversationQueryRequest): Promise<ReadableStream> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to send chat message: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  }

  /**
   * Stream a chat response and handle the Server-Sent Events
   */
  async *streamChatResponse(request: ConversationQueryRequest): AsyncGenerator<any, void, unknown> {
    const stream = await this.sendChatMessage(request);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (error) {
              console.warn('Failed to parse SSE data:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
export default conversationService;
