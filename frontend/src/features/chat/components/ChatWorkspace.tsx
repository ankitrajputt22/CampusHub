import { isAxiosError } from 'axios';
import {
  Archive,
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  Flag,
  Inbox,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import {
  broadcastChatUnreadCount,
  getChatConversation,
  getChatConversations,
  getChatMessages,
  markChatConversationRead,
  reportChatMessage,
  sendChatMessage,
  setChatConversationArchived,
  type ChatConversation,
  type ChatConversationDetails,
  type ChatMessage,
  type ChatReportReason,
} from '../api/chatApi';
import { ChatSafetyWarning } from './ChatSafetyWarning';
import { ReportMessageModal } from './ReportMessageModal';

const POLL_INTERVAL = 12_000;

export function ChatWorkspace({ conversationId }: { conversationId?: number }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [details, setDetails] = useState<ChatConversationDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(Boolean(conversationId));
  const [chatError, setChatError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messagePage, setMessagePage] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<number | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(
    async (signal?: AbortSignal, quiet = false) => {
      if (!quiet) setListLoading(true);
      setListError(null);
      try {
        const result = await getChatConversations(
          {
            search: search.trim() || undefined,
            archived: showArchived,
            size: 20,
          },
          signal,
        );
        setConversations(result.conversations);
      } catch (requestError) {
        if (!isCancelled(requestError)) {
          setListError(apiErrorMessage(requestError));
        }
      } finally {
        if (!signal?.aborted && !quiet) setListLoading(false);
      }
    },
    [search, showArchived],
  );

  const loadSelectedConversation = useCallback(
    async (signal?: AbortSignal, quiet = false) => {
      if (!conversationId) return;
      if (!Number.isInteger(conversationId) || conversationId < 1) {
        setChatError('This conversation link is invalid.');
        setChatLoading(false);
        return;
      }
      if (!quiet) setChatLoading(true);
      setChatError(null);
      try {
        const [conversation, messagePageResult] = await Promise.all([
          getChatConversation(conversationId, signal),
          getChatMessages(conversationId, 0, 30, signal),
        ]);
        setDetails(conversation);
        setMessages((current) =>
          quiet
            ? mergeMessages(current, messagePageResult.messages)
            : messagePageResult.messages,
        );
        if (!quiet) setMessagePage(0);
        setHasOlder(messagePageResult.hasMore);
        if (conversation.conversation.unreadCount > 0) {
          const read = await markChatConversationRead(conversationId);
          broadcastChatUnreadCount(read.unreadCount);
          setConversations((current) =>
            current.map((item) =>
              item.id === conversationId ? { ...item, unreadCount: 0 } : item,
            ),
          );
        }
      } catch (requestError) {
        if (!isCancelled(requestError)) {
          setChatError(apiErrorMessage(requestError));
          if (!quiet) {
            setDetails(null);
            setMessages([]);
          }
        }
      } finally {
        if (!signal?.aborted && !quiet) setChatLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const delay = window.setTimeout(
      () => void loadConversations(controller.signal),
      250,
    );
    const interval = window.setInterval(
      () => void loadConversations(undefined, true),
      POLL_INTERVAL,
    );
    return () => {
      controller.abort();
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
  }, [loadConversations]);

  useEffect(() => {
    setDetails(null);
    setMessages([]);
    setNotice(null);
    if (!conversationId) {
      setChatLoading(false);
      return;
    }
    const controller = new AbortController();
    void loadSelectedConversation(controller.signal);
    const interval = window.setInterval(
      () => void loadSelectedConversation(undefined, true),
      POLL_INTERVAL,
    );
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [conversationId, loadSelectedConversation]);

  useEffect(() => {
    if (!chatLoading && messages.length > 0 && messagePage === 0) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLoading, messagePage, messages.length]);

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!conversationId || !message || sending) return;
    setSending(true);
    setChatError(null);
    try {
      const sent = await sendChatMessage(conversationId, message);
      setMessages((current) => mergeMessages(current, [sent]));
      setDraft('');
      setMessagePage(0);
      await loadConversations(undefined, true);
      window.setTimeout(
        () => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
        0,
      );
    } catch (requestError) {
      setChatError(apiErrorMessage(requestError));
    } finally {
      setSending(false);
    }
  }

  async function loadOlderMessages() {
    if (!conversationId || olderLoading || !hasOlder) return;
    setOlderLoading(true);
    setChatError(null);
    try {
      const nextPage = messagePage + 1;
      const result = await getChatMessages(conversationId, nextPage, 30);
      setMessages((current) => mergeMessages(result.messages, current));
      setMessagePage(nextPage);
      setHasOlder(result.hasMore);
    } catch (requestError) {
      setChatError(apiErrorMessage(requestError));
    } finally {
      setOlderLoading(false);
    }
  }

  async function toggleArchive() {
    if (!details) return;
    const nextArchived = !details.conversation.archived;
    setChatError(null);
    try {
      await setChatConversationArchived(details.conversation.id, nextArchived);
      setNotice(
        nextArchived ? 'Conversation archived.' : 'Conversation restored.',
      );
      await loadConversations();
      navigate('/student/chats');
    } catch (requestError) {
      setChatError(apiErrorMessage(requestError));
    }
  }

  async function submitReport(reason: ChatReportReason, description: string) {
    if (!reportMessageId) return;
    setReportBusy(true);
    setReportError(null);
    try {
      await reportChatMessage(reportMessageId, reason, description);
      setReportMessageId(null);
      setNotice('Message reported. Campus Hub moderators will review it.');
    } catch (requestError) {
      setReportError(apiErrorMessage(requestError));
    } finally {
      setReportBusy(false);
    }
  }

  const selectedId = conversationId;

  return (
    <div className="space-y-4 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Private college messaging
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            Messages
          </h1>
          <p className="mt-1 text-sm text-[#687587]">
            Coordinate campus deals without exposing your email or phone.
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 text-sm font-black text-[#007b95]"
          to="/safety-guidelines"
        >
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Chat safety
        </Link>
      </header>

      {notice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      )}

      <section className="grid min-h-[680px] overflow-hidden rounded-2xl border border-[#d7e0ea] bg-white shadow-[0_8px_28px_rgba(3,22,53,0.07)] lg:grid-cols-[360px_minmax(0,1fr)]">
        <div
          className={`border-r border-[#e0e6ee] ${selectedId ? 'hidden lg:flex' : 'flex'} min-h-[680px] flex-col`}
        >
          <div className="border-b border-[#e0e6ee] p-4">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]"
              />
              <input
                aria-label="Search conversations"
                className="h-11 w-full rounded-xl border border-[#ced8e4] bg-[#f7f9fc] pl-10 pr-3 text-sm outline-none focus:border-[#007b95] focus:bg-white focus:ring-2 focus:ring-cyan-100"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people or listings"
                type="search"
                value={search}
              />
            </div>
            <button
              aria-pressed={showArchived}
              className={`mt-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black ${
                showArchived
                  ? 'bg-[#071b33] text-white'
                  : 'bg-[#eff4ff] text-[#344960]'
              }`}
              onClick={() => setShowArchived((current) => !current)}
              type="button"
            >
              <Archive aria-hidden="true" className="h-3.5 w-3.5" />
              {showArchived ? 'Viewing archived' : 'Archived'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <LoadingState label="Loading conversations…" />
            ) : listError ? (
              <ErrorState
                message={listError}
                onRetry={() => void loadConversations()}
              />
            ) : conversations.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Inbox
                  aria-hidden="true"
                  className="mx-auto h-9 w-9 text-[#9aa7b8]"
                />
                <h2 className="mt-4 font-black text-[#263b53]">
                  {showArchived ? 'No archived chats' : 'No conversations yet'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#718096]">
                  {showArchived
                    ? 'Archived conversations will appear here.'
                    : 'Open an active listing and choose Contact seller to start a private chat.'}
                </p>
                {!showArchived && (
                  <Link
                    className="mt-4 inline-flex text-sm font-black text-[#007b95]"
                    to="/student/marketplace"
                  >
                    Browse marketplace
                  </Link>
                )}
              </div>
            ) : (
              conversations.map((conversation) => (
                <ConversationCard
                  active={selectedId === conversation.id}
                  conversation={conversation}
                  key={conversation.id}
                  onOpen={() => navigate(`/student/chats/${conversation.id}`)}
                />
              ))
            )}
          </div>
        </div>

        <div
          className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col`}
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-[#007b95]">
                  <MessageCircle aria-hidden="true" className="h-8 w-8" />
                </span>
                <h2 className="mt-5 text-xl font-black text-[#071b33]">
                  Select a conversation
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#687587]">
                  Messages are private to the verified buyer and seller and
                  remain linked to the listing or order.
                </p>
              </div>
            </div>
          ) : chatLoading ? (
            <LoadingState label="Loading messages…" />
          ) : chatError && !details ? (
            <ErrorState
              message={chatError}
              onRetry={() => void loadSelectedConversation()}
            />
          ) : details ? (
            <>
              <ChatHeader
                details={details}
                onArchive={() => void toggleArchive()}
                onBack={() => navigate('/student/chats')}
              />
              <ChatSafetyWarning />
              {chatError && (
                <p
                  className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-800"
                  role="alert"
                >
                  {chatError}
                </p>
              )}
              <div className="flex-1 overflow-y-auto bg-[#f7f9fc] px-4 py-5 sm:px-6">
                {hasOlder && (
                  <div className="mb-5 text-center">
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#ccd7e4] bg-white px-4 text-xs font-black text-[#4a5f77] disabled:opacity-60"
                      disabled={olderLoading}
                      onClick={() => void loadOlderMessages()}
                      type="button"
                    >
                      {olderLoading && (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Load older messages
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onReport={() => {
                        setReportError(null);
                        setReportMessageId(message.id);
                      }}
                    />
                  ))}
                  <div ref={messageEndRef} />
                </div>
              </div>
              <form
                className="border-t border-[#e0e6ee] bg-white p-3 sm:p-4"
                onSubmit={submitMessage}
              >
                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Message</span>
                    <textarea
                      className="max-h-36 min-h-11 w-full resize-none rounded-xl border border-[#cbd5e1] px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#007b95] focus:ring-2 focus:ring-cyan-100"
                      maxLength={1000}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Write a message…"
                      rows={1}
                      value={draft}
                    />
                  </label>
                  <button
                    aria-label="Send message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071b33] text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={sending || !draft.trim()}
                    type="submit"
                  >
                    {sending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-[#7a8797]">
                  Enter to send · Shift + Enter for a new line · {draft.length}
                  /1000
                </p>
              </form>
            </>
          ) : null}
        </div>
      </section>

      <ReportMessageModal
        error={reportError}
        onClose={() => {
          if (!reportBusy) setReportMessageId(null);
        }}
        onSubmit={submitReport}
        open={reportMessageId !== null}
        submitting={reportBusy}
      />
    </div>
  );
}

function ConversationCard({
  conversation,
  active,
  onOpen,
}: {
  conversation: ChatConversation;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className={`flex w-full gap-3 border-b border-[#edf0f4] px-4 py-4 text-left transition ${
        active ? 'bg-cyan-50' : 'hover:bg-[#f7f9fc]'
      }`}
      onClick={onOpen}
      type="button"
    >
      <UserAvatar
        name={conversation.otherUser.fullName}
        url={conversation.otherUser.profilePhotoUrl}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-black text-[#132b45]">
            {conversation.otherUser.fullName}
          </p>
          <time className="shrink-0 text-[10px] font-semibold text-[#8290a1]">
            {conversation.lastMessageAt
              ? relativeTime(conversation.lastMessageAt)
              : ''}
          </time>
        </div>
        <p className="mt-1 truncate text-xs font-bold text-[#557089]">
          {conversation.listing.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p
            className={`min-w-0 flex-1 truncate text-xs ${
              conversation.unreadCount > 0
                ? 'font-black text-[#263b53]'
                : 'font-medium text-[#7a8797]'
            }`}
          >
            {conversation.lastMessage?.message ?? 'Conversation started'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#007b95] px-1 text-[10px] font-black text-white">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ChatHeader({
  details,
  onBack,
  onArchive,
}: {
  details: ChatConversationDetails;
  onBack: () => void;
  onArchive: () => void;
}) {
  const { conversation } = details;
  const imageUrl = resolveApiAssetUrl(conversation.listing.imageUrl);
  return (
    <header className="border-b border-[#e0e6ee] bg-white">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <button
          aria-label="Back to conversations"
          className="rounded-lg p-2 text-[#425870] hover:bg-[#eff4ff] lg:hidden"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <UserAvatar
          name={conversation.otherUser.fullName}
          url={conversation.otherUser.profilePhotoUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate font-black text-[#102a44]">
              {conversation.otherUser.fullName}
            </h2>
            {conversation.otherUser.verifiedStudent && (
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#007b95]" />
            )}
          </div>
          <p className="truncate text-xs font-semibold text-[#718096]">
            {details.participantRole === 'BUYER' ? 'Seller' : 'Buyer'} · Trust{' '}
            {conversation.otherUser.trustScore}/100
            {conversation.otherUser.sellerRating > 0
              ? ` · ${conversation.otherUser.sellerRating.toFixed(1)} rating`
              : ''}
          </p>
        </div>
        <button
          aria-label={
            conversation.archived
              ? 'Restore conversation'
              : 'Archive conversation'
          }
          className="rounded-lg p-2 text-[#50657c] hover:bg-[#eff4ff]"
          onClick={onArchive}
          title={conversation.archived ? 'Restore conversation' : 'Archive'}
          type="button"
        >
          <Archive className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-3 border-t border-[#edf0f4] bg-[#fbfcfe] px-4 py-2.5 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#e8edf4]">
          {imageUrl ? (
            <img alt="" className="h-full w-full object-cover" src={imageUrl} />
          ) : (
            <Inbox className="m-auto h-4 w-4 text-[#7a8797]" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            className="block truncate text-sm font-black text-[#203650] hover:text-[#007b95]"
            to={`/listing/${conversation.listing.id}`}
          >
            {conversation.listing.title}
          </Link>
          <p className="text-xs font-semibold text-[#718096]">
            ₹{conversation.listing.price.toLocaleString('en-IN')} ·{' '}
            {humanize(conversation.listing.condition)}
          </p>
        </div>
        {conversation.order && (
          <Link
            className="inline-flex items-center gap-1 text-xs font-black text-[#007b95]"
            to={`/student/orders/${conversation.order.id}`}
          >
            Order <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </header>
  );
}

function MessageBubble({
  message,
  onReport,
}: {
  message: ChatMessage;
  onReport: () => void;
}) {
  if (message.type === 'SYSTEM') {
    return (
      <div className="py-2 text-center">
        <span className="inline-flex rounded-full bg-[#e9eef5] px-3 py-1.5 text-xs font-bold text-[#627286]">
          {message.message}
        </span>
      </div>
    );
  }
  return (
    <div
      className={`group flex ${message.sentByMe ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${
          message.sentByMe
            ? 'rounded-br-md bg-[#071b33] text-white'
            : 'rounded-bl-md border border-[#dde4ec] bg-white text-[#203650]'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {message.message}
        </p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-semibold ${
            message.sentByMe ? 'text-slate-300' : 'text-[#8190a1]'
          }`}
        >
          <time>{messageTime(message.createdAt)}</time>
          {message.sentByMe && (
            <CheckCheck
              aria-label={message.status === 'READ' ? 'Read' : 'Sent'}
              className={`h-3.5 w-3.5 ${
                message.status === 'READ' ? 'text-cyan-300' : ''
              }`}
            />
          )}
        </div>
        {message.reportable && (
          <button
            aria-label="Report message"
            className="absolute -right-8 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#718096] opacity-60 transition hover:bg-rose-50 hover:text-rose-700 sm:-right-9 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            onClick={onReport}
            title="Report message"
            type="button"
          >
            <Flag className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function UserAvatar({ name, url }: { name: string; url: string | null }) {
  const imageUrl = resolveApiAssetUrl(url);
  return (
    <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#dce7fb] text-xs font-black text-[#132b45] ring-2 ring-white">
      {imageUrl ? (
        <img alt="" className="h-full w-full object-cover" src={imageUrl} />
      ) : (
        <span className="m-auto">{initials(name)}</span>
      )}
    </span>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 px-6 py-16 text-sm font-bold text-[#718096]">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
      <div>
        <RefreshCw className="mx-auto h-7 w-7 text-rose-600" />
        <p className="mt-3 text-sm font-black text-[#203650]">
          Messages could not load
        </p>
        <p className="mt-1 text-xs leading-5 text-rose-700">{message}</p>
        <button
          className="mt-4 h-9 rounded-xl bg-[#071b33] px-4 text-xs font-black text-white"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function mergeMessages(first: ChatMessage[], second: ChatMessage[]) {
  const byId = new Map<number, ChatMessage>();
  [...first, ...second].forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return 'Unable to reach Campus Hub. Please make sure the backend is running.';
    }
    return error.response.data?.message ?? 'An unexpected error occurred.';
  }
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred.';
}

function isCancelled(error: unknown) {
  return isAxiosError(error) && error.code === 'ERR_CANCELED';
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function relativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d`;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
