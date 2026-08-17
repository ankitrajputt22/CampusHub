import { apiClient } from '../../../lib/apiClient';

export type ChatUser = {
  id: number;
  fullName: string;
  profilePhotoUrl: string | null;
  verifiedStudent: boolean;
  trustScore: number;
  sellerRating: number;
  collegeName: string;
};

export type ChatListing = {
  id: number;
  title: string;
  price: number;
  condition: string;
  imageUrl: string | null;
  status: string;
};

export type ChatOrder = {
  id: number;
  orderNumber: string;
  status: string;
};

export type ChatLastMessage = {
  id: number;
  message: string;
  type: 'TEXT' | 'SYSTEM';
  senderId: number | null;
  createdAt: string;
};

export type ChatConversation = {
  id: number;
  conversationNumber: string;
  status: string;
  otherUser: ChatUser;
  listing: ChatListing;
  order: ChatOrder | null;
  lastMessage: ChatLastMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
  archived: boolean;
  muted: boolean;
};

export type ChatConversationDetails = {
  conversation: ChatConversation;
  participantRole: 'BUYER' | 'SELLER';
};

export type ChatConversationPage = {
  conversations: ChatConversation[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
};

export type ChatMessage = {
  id: number;
  type: 'TEXT' | 'SYSTEM';
  message: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'DELETED';
  sentByMe: boolean;
  senderId: number | null;
  createdAt: string;
  readAt: string | null;
  reportable: boolean;
};

export type ChatMessagePage = {
  messages: ChatMessage[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
};

export type ChatReportReason =
  | 'HARASSMENT'
  | 'SCAM_ATTEMPT'
  | 'ABUSIVE_LANGUAGE'
  | 'ASKING_FOR_OTP_PASSWORD'
  | 'PAYMENT_FRAUD'
  | 'UNSAFE_PICKUP_BEHAVIOR'
  | 'SPAM'
  | 'OTHER';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function getChatConversations(
  query: {
    search?: string;
    archived?: boolean;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ChatConversationPage>>(
    '/chats/conversations',
    { params: query, signal },
  );
  return response.data.data;
}

export async function createListingConversation(listingId: number) {
  const response = await apiClient.post<ApiEnvelope<ChatConversationDetails>>(
    `/chats/conversations/listing/${listingId}`,
  );
  return response.data.data;
}

export async function createOrderConversation(orderId: number) {
  const response = await apiClient.post<ApiEnvelope<ChatConversationDetails>>(
    `/chats/conversations/order/${orderId}`,
  );
  return response.data.data;
}

export async function getChatConversation(
  conversationId: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ChatConversationDetails>>(
    `/chats/conversations/${conversationId}`,
    { signal },
  );
  return response.data.data;
}

export async function getChatMessages(
  conversationId: number,
  page = 0,
  size = 30,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ApiEnvelope<ChatMessagePage>>(
    `/chats/conversations/${conversationId}/messages`,
    { params: { page, size }, signal },
  );
  return response.data.data;
}

export async function sendChatMessage(conversationId: number, message: string) {
  const response = await apiClient.post<ApiEnvelope<ChatMessage>>(
    `/chats/conversations/${conversationId}/messages`,
    { message },
  );
  return response.data.data;
}

export async function markChatConversationRead(conversationId: number) {
  const response = await apiClient.patch<
    ApiEnvelope<{
      conversationId: number;
      readMessages: number;
      unreadCount: number;
      readAt: string;
    }>
  >(`/chats/conversations/${conversationId}/read`);
  broadcastChatUnreadCount(response.data.data.unreadCount);
  return response.data.data;
}

export async function setChatConversationArchived(
  conversationId: number,
  archived: boolean,
) {
  const action = archived ? 'archive' : 'unarchive';
  const response = await apiClient.patch<
    ApiEnvelope<{
      conversationId: number;
      archived: boolean;
      updatedAt: string;
    }>
  >(`/chats/conversations/${conversationId}/${action}`);
  return response.data.data;
}

export async function getChatUnreadCount(signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<{ unreadCount: number }>>(
    '/chats/unread-count',
    { signal },
  );
  return response.data.data;
}

export async function reportChatMessage(
  messageId: number,
  reason: ChatReportReason,
  description: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<{ reportId: number; status: string; createdAt: string }>
  >(`/chats/messages/${messageId}/report`, { reason, description });
  return response.data.data;
}

export const chatUnreadUpdatedEvent = 'campusHub:chat-unread-updated';

export function broadcastChatUnreadCount(unreadCount?: number) {
  window.dispatchEvent(
    new CustomEvent(chatUnreadUpdatedEvent, { detail: { unreadCount } }),
  );
}
