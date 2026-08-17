import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  History,
  Link2,
  LoaderCircle,
  MessageSquare,
  NotebookPen,
  Send,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  addSupportInternalNote,
  downloadSupportAttachment,
  getAdminSupportTicket,
  replyToAdminSupportTicket,
  supportCategories,
  updateSupportTicketStatus,
} from '../api/supportApi';
import type { SupportStatus, SupportTicketDetails } from '../api/supportApi';
import {
  AdminErrorState,
  AdminLoadingState,
} from '../../admin/components/AdminUi';
import {
  SupportNotice,
  SupportPriorityBadge,
  SupportStatusBadge,
} from '../components/SupportUi';
import {
  formatSupportDate,
  supportErrorMessage,
  supportLabel,
  validateSupportFiles,
} from '../lib/supportUtils';

const statusOptions: SupportStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
  'SPAM',
];

export function AdminSupportTicketDetailsPage() {
  const { ticketId } = useParams();
  const numericId = Number(ticketId);
  const [ticket, setTicket] = useState<SupportTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reply, setReply] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [nextStatus, setNextStatus] = useState<SupportStatus>('IN_PROGRESS');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(numericId) || numericId < 1) {
        setError('Invalid support ticket ID.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const loaded = await getAdminSupportTicket(numericId, signal);
        setTicket(loaded);
        setNextStatus(loaded.status === 'OPEN' ? 'IN_PROGRESS' : loaded.status);
      } catch (caught) {
        if (!signal?.aborted) {
          setError(
            supportErrorMessage(caught, 'Unable to load ticket details.'),
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [numericId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reply.trim().length < 2) {
      setError('Reply must be at least 2 characters.');
      return;
    }
    const fileError = validateSupportFiles(replyFiles);
    if (fileError) {
      setError(fileError);
      return;
    }
    setSending(true);
    setError('');
    try {
      await replyToAdminSupportTicket(numericId, reply.trim(), replyFiles);
      setReply('');
      setReplyFiles([]);
      setSuccess('Reply sent successfully.');
      await load();
    } catch (caught) {
      setError(supportErrorMessage(caught, 'Unable to send reply.'));
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nextStatus === ticket?.status) {
      setError('Select a different status before updating.');
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateSupportTicketStatus(numericId, nextStatus, statusNote.trim());
      setStatusNote('');
      setSuccess('Ticket status updated successfully.');
      await load();
    } catch (caught) {
      setError(supportErrorMessage(caught, 'Unable to update ticket status.'));
    } finally {
      setUpdating(false);
    }
  }

  async function saveInternalNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (internalNote.trim().length < 2) {
      setError('Internal note must be at least 2 characters.');
      return;
    }
    setSavingNote(true);
    setError('');
    try {
      await addSupportInternalNote(numericId, internalNote.trim());
      setInternalNote('');
      setSuccess('Internal note added successfully.');
      await load();
    } catch (caught) {
      setError(supportErrorMessage(caught, 'Unable to save internal note.'));
    } finally {
      setSavingNote(false);
    }
  }

  if (loading && !ticket)
    return <AdminLoadingState label="Loading support ticket..." />;
  if (error && !ticket) {
    return (
      <AdminErrorState
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Support ticket could not load"
      />
    );
  }
  if (!ticket) return null;

  const category =
    supportCategories.find((item) => item.value === ticket.category)?.label ??
    supportLabel(ticket.category);
  const terminal = ['CLOSED', 'REJECTED', 'SPAM'].includes(ticket.status);

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[#42526a] hover:text-cyan-800"
        to="/admin/support"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to support queue
      </Link>

      {success && <SupportNotice tone="success">{success}</SupportNotice>}
      {error && <SupportNotice tone="error">{error}</SupportNotice>}

      <header className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-800">
                {ticket.ticketNumber}
              </span>
              <SupportStatusBadge status={ticket.status} />
              <SupportPriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="mt-3 font-display text-2xl font-black text-[#031635] sm:text-3xl">
              {ticket.subject}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#68707d]">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> {category}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />{' '}
                {formatSupportDate(ticket.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4" />{' '}
                {ticket.submitter.guest ? 'Public request' : 'Verified student'}
              </span>
            </div>
          </div>
          <form
            className="grid w-full gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto] xl:max-w-2xl"
            onSubmit={(event) => void updateStatus(event)}
          >
            <select
              aria-label="New support status"
              className={inputClass}
              onChange={(event) =>
                setNextStatus(event.target.value as SupportStatus)
              }
              value={nextStatus}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {supportLabel(option)}
                </option>
              ))}
            </select>
            <input
              aria-label="Status update note"
              className={inputClass}
              maxLength={500}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder="Status note (optional)"
              value={statusNote}
            />
            <button
              className="h-11 rounded-xl bg-[#031635] px-4 text-sm font-black text-white disabled:opacity-60"
              disabled={updating}
              type="submit"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
            <div className="border-b border-[#e6e8ee] px-5 py-4">
              <h2 className="flex items-center gap-2 font-black text-[#031635]">
                <MessageSquare className="h-5 w-5 text-cyan-700" />
                Ticket conversation
              </h2>
            </div>
            <div className="space-y-4 p-5">
              <ConversationItem
                label={`${ticket.submitter.name} · Initial request`}
                message={ticket.description}
                time={ticket.createdAt}
              />
              {ticket.replies.map((item) => (
                <ConversationItem
                  internal={item.internalNote}
                  key={item.id}
                  label={`${item.senderName} · ${item.internalNote ? 'Internal note' : supportLabel(item.senderType)}`}
                  message={item.message}
                  time={item.createdAt}
                />
              ))}
            </div>

            {!terminal && (
              <form
                className="border-t border-[#e6e8ee] bg-slate-50 p-5"
                onSubmit={(event) => void sendReply(event)}
              >
                <label
                  className="text-sm font-black text-[#13233a]"
                  htmlFor="admin-support-reply"
                >
                  Reply to user
                </label>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cbd3de] bg-white p-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  id="admin-support-reply"
                  maxLength={2000}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a clear, actionable response..."
                  value={reply}
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="cursor-pointer text-sm font-bold text-[#42526a] hover:text-cyan-800">
                    {replyFiles.length
                      ? `${replyFiles.length} file(s) selected`
                      : 'Attach images or PDF'}
                    <input
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="sr-only"
                      multiple
                      onChange={(event) => {
                        const selected = Array.from(event.target.files ?? []);
                        const validation = validateSupportFiles(selected);
                        if (validation) setError(validation);
                        else setReplyFiles(selected);
                        event.target.value = '';
                      }}
                      type="file"
                    />
                  </label>
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#031635] px-5 text-sm font-black text-white disabled:opacity-60"
                    disabled={sending}
                    type="submit"
                  >
                    {sending ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-black text-[#031635]">
              <History className="h-5 w-5 text-cyan-700" /> Status history
            </h2>
            <div className="mt-4 space-y-3">
              {ticket.statusHistory.map((item) => (
                <article
                  className="flex gap-3 border-l-2 border-cyan-200 pl-4"
                  key={item.id}
                >
                  <div>
                    <p className="text-sm font-bold text-[#25364d]">
                      {item.oldStatus
                        ? `${supportLabel(item.oldStatus)} → ${supportLabel(item.newStatus)}`
                        : supportLabel(item.newStatus)}
                    </p>
                    <p className="mt-1 text-xs text-[#778294]">
                      {item.changedBy ?? item.changedByRole} ·{' '}
                      {formatSupportDate(item.createdAt)}
                    </p>
                    {item.note && (
                      <p className="mt-1 text-sm leading-6 text-[#5d6a7d]">
                        {item.note}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="font-black text-[#031635]">Submitter details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Name" value={ticket.submitter.name} />
              <Detail label="Email" value={ticket.submitter.email} />
              <Detail
                label="College"
                value={ticket.submitter.collegeName ?? 'Public request'}
              />
              <Detail
                label="Assigned admin"
                value={ticket.assignedAdmin ?? 'Not assigned'}
              />
              {ticket.relatedEntityType !== 'NONE' && (
                <Detail
                  label="Related record"
                  value={`${supportLabel(ticket.relatedEntityType)} #${ticket.relatedEntityId}`}
                />
              )}
            </dl>
          </section>

          {ticket.attachments.length > 0 && (
            <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-black text-[#031635]">
                <Link2 className="h-4 w-4 text-cyan-700" /> Attachments
              </h2>
              <div className="mt-3 space-y-2">
                {ticket.attachments.map((attachment) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e0e5ec] px-3 py-3 text-left text-sm hover:border-cyan-500"
                    key={attachment.id}
                    onClick={() =>
                      void downloadSupportAttachment(
                        attachment.id,
                        attachment.fileName,
                      ).catch((caught) =>
                        setError(
                          supportErrorMessage(
                            caught,
                            'Unable to download attachment.',
                          ),
                        ),
                      )
                    }
                    type="button"
                  >
                    <span className="min-w-0 truncate">
                      {attachment.fileName}
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-cyan-700" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <form
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
            onSubmit={(event) => void saveInternalNote(event)}
          >
            <h2 className="flex items-center gap-2 font-black text-amber-950">
              <NotebookPen className="h-5 w-5" /> Internal admin note
            </h2>
            <p className="mt-2 text-xs leading-5 text-amber-900">
              Internal notes are visible only to administrators.
            </p>
            <textarea
              className="mt-3 min-h-24 w-full resize-y rounded-xl border border-amber-300 bg-white p-3 text-sm outline-none focus:border-amber-600"
              maxLength={2000}
              onChange={(event) => setInternalNote(event.target.value)}
              placeholder="Record investigation context or handoff notes..."
              value={internalNote}
            />
            <button
              className="mt-3 h-10 w-full rounded-xl bg-amber-800 px-4 text-sm font-black text-white disabled:opacity-60"
              disabled={savingNote}
              type="submit"
            >
              {savingNote ? 'Saving...' : 'Add Internal Note'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-[#cbd3de] bg-white px-3 text-sm text-[#27374c] outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';

function ConversationItem({
  label,
  message,
  time,
  internal,
}: {
  label: string;
  message: string;
  time: string;
  internal?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${internal ? 'border-amber-300 bg-amber-50' : 'border-[#dce3eb] bg-white'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black text-[#21344e]">{label}</p>
        <time className="text-[11px] text-[#7c8796]">
          {formatSupportDate(time)}
        </time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#44536a]">
        {message}
      </p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#edf0f4] pb-3 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8994a3]">
        {label}
      </dt>
      <dd className="mt-1 break-words font-bold text-[#263a53]">{value}</dd>
    </div>
  );
}
