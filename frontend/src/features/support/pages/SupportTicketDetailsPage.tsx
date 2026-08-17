import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  Send,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import {
  closeSupportTicket,
  downloadSupportAttachment,
  getSupportTicket,
  replyToSupportTicket,
  supportCategories,
} from '../api/supportApi';
import type { SupportTicketDetails } from '../api/supportApi';
import {
  SupportError,
  SupportLoading,
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

export function SupportTicketDetailsPage() {
  const { ticketId } = useParams();
  const location = useLocation();
  const numericId = Number(ticketId);
  const [ticket, setTicket] = useState<SupportTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    (location.state as { submitted?: boolean } | null)?.submitted
      ? 'Support ticket submitted successfully.'
      : '',
  );
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
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
        setTicket(await getSupportTicket(numericId, signal));
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
    const fileError = validateSupportFiles(files);
    if (fileError) {
      setError(fileError);
      return;
    }
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await replyToSupportTicket(numericId, reply.trim(), files);
      setReply('');
      setFiles([]);
      setSuccess('Reply sent successfully.');
      await load();
    } catch (caught) {
      setError(supportErrorMessage(caught, 'Unable to send reply.'));
    } finally {
      setSending(false);
    }
  }

  async function closeTicket() {
    if (
      !window.confirm(
        'Close this support ticket? You will not be able to add more replies.',
      )
    ) {
      return;
    }
    setClosing(true);
    setError('');
    try {
      await closeSupportTicket(numericId);
      setSuccess('Ticket closed successfully.');
      await load();
    } catch (caught) {
      setError(supportErrorMessage(caught, 'Unable to close ticket.'));
    } finally {
      setClosing(false);
    }
  }

  if (loading && !ticket)
    return <SupportLoading label="Loading ticket details..." />;
  if (error && !ticket) {
    return (
      <SupportError
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        title="Ticket details could not load"
      />
    );
  }
  if (!ticket) return null;

  const canReply = !['CLOSED', 'REJECTED', 'SPAM'].includes(ticket.status);
  const category =
    supportCategories.find((item) => item.value === ticket.category)?.label ??
    supportLabel(ticket.category);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[#42526a] hover:text-cyan-800"
        to="/student/support"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to support tickets
      </Link>

      {success && <SupportNotice tone="success">{success}</SupportNotice>}
      {error && <SupportNotice tone="error">{error}</SupportNotice>}

      <header className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
              {ticket.assignedAdmin && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" /> Assigned to{' '}
                  {ticket.assignedAdmin}
                </span>
              )}
            </div>
          </div>
          {canReply && (
            <button
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              disabled={closing}
              onClick={() => void closeTicket()}
              type="button"
            >
              {closing ? 'Closing...' : 'Close Ticket'}
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-2xl border border-[#d6d9e2] bg-white shadow-sm">
          <div className="border-b border-[#e6e8ee] px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-black text-[#031635]">
              <MessageSquare className="h-5 w-5 text-cyan-700" />
              Conversation
            </h2>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <Message
              date={ticket.createdAt}
              label="You · Initial request"
              message={ticket.description}
              own
            />
            {ticket.replies.map((item) => (
              <Message
                date={item.createdAt}
                key={item.id}
                label={
                  item.senderType === 'ADMIN'
                    ? `${item.senderName} · Campus Hub Support`
                    : `${item.senderName} · You`
                }
                message={item.message}
                own={item.senderType === 'STUDENT'}
              />
            ))}
          </div>

          {canReply ? (
            <form
              className="border-t border-[#e6e8ee] bg-slate-50 p-5 sm:p-6"
              onSubmit={(event) => void sendReply(event)}
            >
              <label
                className="text-sm font-black text-[#13233a]"
                htmlFor="support-reply"
              >
                Reply to Support
              </label>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[#cbd3de] bg-white p-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                id="support-reply"
                maxLength={2000}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Add the information requested by the support team..."
                value={reply}
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[#42526a] hover:text-cyan-800">
                  <Paperclip className="h-4 w-4" />
                  {files.length
                    ? `${files.length} file(s) selected`
                    : 'Attach files'}
                  <input
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="sr-only"
                    multiple
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []);
                      const validation = validateSupportFiles(selected);
                      if (validation) setError(validation);
                      else setFiles(selected);
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
                  {sending ? 'Sending reply...' : 'Send Reply'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 border-t border-[#e6e8ee] bg-slate-50 px-5 py-4 text-sm text-[#68707d] sm:px-6">
              <LockKeyhole className="h-4 w-4" />
              This ticket is closed and cannot receive new replies.
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="font-black text-[#031635]">Ticket details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Category" value={category} />
              <Detail label="Status" value={supportLabel(ticket.status)} />
              <Detail label="Priority" value={supportLabel(ticket.priority)} />
              <Detail
                label="Last updated"
                value={formatSupportDate(ticket.updatedAt)}
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

          <SupportNotice tone="warning">
            Campus Hub support will never ask for your password, OTP, UPI PIN,
            or full card details.
          </SupportNotice>
        </aside>
      </div>
    </div>
  );
}

function Message({
  label,
  message,
  date,
  own,
}: {
  label: string;
  message: string;
  date: string;
  own?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${own ? 'ml-auto border-cyan-200 bg-cyan-50' : 'mr-auto border-[#dce3eb] bg-white'} max-w-[92%]`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black text-[#21344e]">{label}</p>
        <time className="text-[11px] text-[#7c8796]">
          {formatSupportDate(date)}
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
    <div className="flex items-start justify-between gap-4 border-b border-[#edf0f4] pb-3 last:border-0 last:pb-0">
      <dt className="text-[#7b8796]">{label}</dt>
      <dd className="text-right font-bold text-[#263a53]">{value}</dd>
    </div>
  );
}
