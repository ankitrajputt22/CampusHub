import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getChatConversation,
  getChatConversations,
  getChatMessages,
  markChatConversationRead,
  reportChatMessage,
  sendChatMessage,
  setChatConversationArchived,
} from '../api/chatApi';
import { ChatWorkspace } from '../components/ChatWorkspace';

vi.mock('../api/chatApi', async () => {
  const actual =
    await vi.importActual<typeof import('../api/chatApi')>('../api/chatApi');
  return {
    ...actual,
    getChatConversation: vi.fn(),
    getChatConversations: vi.fn(),
    getChatMessages: vi.fn(),
    markChatConversationRead: vi.fn(),
    reportChatMessage: vi.fn(),
    sendChatMessage: vi.fn(),
    setChatConversationArchived: vi.fn(),
  };
});

const conversation = {
  id: 7,
  conversationNumber: 'CH-CHAT-20260808-DEMO',
  status: 'ACTIVE',
  otherUser: {
    id: 2,
    fullName: 'Priya Sharma',
    profilePhotoUrl: null,
    verifiedStudent: true,
    trustScore: 88,
    sellerRating: 4.7,
    collegeName: 'IIT Delhi',
  },
  listing: {
    id: 12,
    title: 'Engineering Mathematics',
    price: 450,
    condition: 'GOOD',
    imageUrl: null,
    status: 'ACTIVE',
  },
  order: null,
  lastMessage: {
    id: 22,
    message: 'Available near the library.',
    type: 'TEXT' as const,
    senderId: 2,
    createdAt: '2026-08-08T09:00:00Z',
  },
  lastMessageAt: '2026-08-08T09:00:00Z',
  unreadCount: 0,
  archived: false,
  muted: false,
};

describe('Phase 21 chat workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(getChatConversations).mockResolvedValue({
      conversations: [conversation],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasMore: false,
    });
    vi.mocked(getChatConversation).mockResolvedValue({
      conversation,
      participantRole: 'BUYER',
    });
    vi.mocked(getChatMessages).mockResolvedValue({
      messages: [
        {
          id: 21,
          type: 'SYSTEM',
          message: 'Conversation started for Engineering Mathematics.',
          status: 'SENT',
          sentByMe: false,
          senderId: null,
          createdAt: '2026-08-08T08:55:00Z',
          readAt: null,
          reportable: false,
        },
        {
          id: 22,
          type: 'TEXT',
          message: 'Available near the library.',
          status: 'SENT',
          sentByMe: false,
          senderId: 2,
          createdAt: '2026-08-08T09:00:00Z',
          readAt: null,
          reportable: true,
        },
      ],
      page: 0,
      size: 30,
      totalElements: 2,
      totalPages: 1,
      hasMore: false,
    });
    vi.mocked(markChatConversationRead).mockResolvedValue({
      conversationId: 7,
      readMessages: 0,
      unreadCount: 0,
      readAt: '2026-08-08T09:01:00Z',
    });
    vi.mocked(sendChatMessage).mockResolvedValue({
      id: 23,
      type: 'TEXT',
      message: 'Can we meet tomorrow?',
      status: 'SENT',
      sentByMe: true,
      senderId: 1,
      createdAt: '2026-08-08T09:02:00Z',
      readAt: null,
      reportable: false,
    });
    vi.mocked(reportChatMessage).mockResolvedValue({
      reportId: 3,
      status: 'PENDING',
      createdAt: '2026-08-08T09:03:00Z',
    });
    vi.mocked(setChatConversationArchived).mockResolvedValue({
      conversationId: 7,
      archived: true,
      updatedAt: '2026-08-08T09:04:00Z',
    });
  });

  it('loads the verified listing-linked conversation and safety guidance', async () => {
    render(
      <MemoryRouter>
        <ChatWorkspace conversationId={7} />
      </MemoryRouter>,
    );

    expect(await screen.findAllByText('Priya Sharma')).not.toHaveLength(0);
    expect(screen.getAllByText('Engineering Mathematics')).not.toHaveLength(0);
    expect(
      screen.getByText(/Campus Hub will never ask for your password/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Available near the library.')).toBeInTheDocument();
  });

  it('sends only the conversation id and message text', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ChatWorkspace conversationId={7} />
      </MemoryRouter>,
    );

    const composer = await screen.findByRole('textbox', { name: 'Message' });
    await user.type(composer, 'Can we meet tomorrow?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenCalledWith(7, 'Can we meet tomorrow?'),
    );
    expect(
      await screen.findByText('Can we meet tomorrow?'),
    ).toBeInTheDocument();
  });
});
