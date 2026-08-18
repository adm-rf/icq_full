import { api } from '../config/api';

export interface Chat {
  id: string;
  name: string;
  lastMessage?: {
    text: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  participants: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export const chatService = {
  async getChats(): Promise<Chat[]> {
    const response = await api.get<Chat[]>('/chats');
    return response.data;
  },

  async getMessages(chatId: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/chats/${chatId}/messages`);
    return response.data;
  },

  async sendMessage(chatId: string, text: string): Promise<Message> {
    const response = await api.post<Message>(`/chats/${chatId}/messages`, { text });
    return response.data;
  },

  async createChat(participantIds: string[]): Promise<Chat> {
    const response = await api.post<Chat>('/chats', { participantIds });
    return response.data;
  },
};
