import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../../auth/api/authApi';
import { relativeNotificationTime } from '../../notifications/lib/notificationFormat';
import {
  getAdminReport,
  moderateTarget,
  updateReportStatus,
  type AdminReportDetails,
} from '../api/reportsApi';

type ActionDefinition = {
  action: string;
  label: string;
  description: string;
  tone: 'navy' | 'amber' | 'rose' | 'green';
  icon: typeof ShieldCheck;
  noteRequired?: boolean;
};

export function AdminReportDetailsPage() {
  const { reportId: reportIdParam } = useParams();
  const reportId = Number(reportIdParam);
  const [report, setReport] = useState<AdminReportDetails>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [note, setNote] = useState('');
  const [runningAction, setRunningAction] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(reportId) || reportId < 1) {
        setError('This report link is invalid.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        setReport(await getAdminReport(reportId, signal));
      } catch (caught) {
        if (!signal?.aborted) setError(getApiErrorMessage(caught));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [reportId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const targetActions = useMemo(
    () => (report ? actionsFor(report) : []),
    [report],
  );

  async function runStatusAction(action: 'under-review' | 'reject' | 'close') {
    if (!report || runningAction) return;
    if (action === 'reject' && !note.trim()) {
      setError('Add a clear reason before rejecting this report.');
      return;
    }
    setRunningAction(`status-${action}`);
    setError('');
    setNotice('');
    try {
      await updateReportStatus(report.id, action, note.trim());
      setNotice(`Report ${action.replace('-', ' ')} completed successfully.`);
      setNote('');
      await load();
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setRunningAction('');
    }
  }

  async function runTargetAction(definition: ActionDefinition) {
    if (!report || runningAction) return;
    if (definition.noteRequired && !note.trim()) {
      setError('Add moderator guidance before issuing this action.');
      return;
    }
    setRunningAction(`target-${definition.action}`);
    setError('');
    setNotice('');
    try {
      await moderateTarget(report, definition.action, note.trim());
      setNotice(`${definition.label} completed successfully.`);
      setNote('');
      await load();
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setRunningAction('');
    }
  }

  if (loading && !report) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <LoaderCircle className="h-9 w-9 animate-spin text-cyan-700" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <section className="max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-xl font-black text-[#031635]">
            Report unavailable
          </h1>
          <p className="mt-2 text-sm text-[#68707d]">{error}</p>
          <button
            className="mt-5 rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white"
            onClick={() => setReloadKey((value) => value + 1)}
            type="button"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800"
        to="/admin/reports"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports queue
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge value={report.priority} />
            <Badge value={report.type} />
            <Badge value={report.status} />
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#031635]">
            Report #{report.id}
          </h1>
          <p className="mt-2 text-sm text-[#68707d]">
            Submitted {relativeNotificationTime(report.submittedAt)}
          </p>
        </div>
        <div className="rounded-xl border border-[#d6d9e2] bg-white px-4 py-3 text-sm shadow-sm">
          <p className="font-black text-[#263b54]">
            {report.previousReportsForTarget} previous report
            {report.previousReportsForTarget === 1 ? '' : 's'} for this target
          </p>
          <p className="mt-1 text-xs text-[#7b8796]">
            Use history and context before taking action.
          </p>
        </div>
      </header>

      {notice && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-[#031635]">
              Report details
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Detail label="Reason" value={formatLabel(report.reason)} />
              <Detail label="Priority" value={formatLabel(report.priority)} />
              <Detail
                label="Reporter"
                value={report.reporter.fullName}
                supporting={report.reporter.collegeName}
              />
              <Detail
                label="Current status"
                value={formatLabel(report.status)}
                supporting={
                  report.reviewedAt
                    ? `Updated ${relativeNotificationTime(report.reviewedAt)}`
                    : undefined
                }
              />
            </dl>
            <div className="mt-5 rounded-xl bg-[#f7f9fc] p-4">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748b]">
                Student-provided context
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#43566d]">
                {report.description || 'No additional details were provided.'}
              </p>
            </div>
            {report.adminResponse && (
              <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-cyan-800">
                  Latest moderator response
                </p>
                <p className="mt-2 text-sm leading-6 text-[#29445a]">
                  {report.adminResponse}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-[#031635]">
              Reported target
            </h2>
            <div className="mt-4 rounded-xl border border-[#e1e6ed] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-[#203852]">
                    {report.target.title}
                  </p>
                  <p className="mt-1 text-sm text-[#68707d]">
                    {report.target.subtitle}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-[#526075]">
                    Owner: {report.target.ownerName}
                  </p>
                </div>
                <Badge value={report.target.status} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-[#031635]">
              Moderation history
            </h2>
            {report.moderationHistory.length ? (
              <ol className="mt-5 space-y-4">
                {report.moderationHistory.map((entry) => (
                  <li
                    className="relative border-l-2 border-cyan-200 pl-5"
                    key={entry.id}
                  >
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-700" />
                    <p className="text-sm font-black text-[#273b53]">
                      {formatLabel(entry.action)}
                    </p>
                    <p className="mt-1 text-xs text-[#7b8796]">
                      {entry.moderatorName} ·{' '}
                      {relativeNotificationTime(entry.createdAt)}
                    </p>
                    {(entry.previousState || entry.newState) && (
                      <p className="mt-2 text-xs font-semibold text-[#526075]">
                        {formatLabel(entry.previousState || 'Not set')} →{' '}
                        {formatLabel(entry.newState || 'Not set')}
                      </p>
                    )}
                    {entry.note && (
                      <p className="mt-2 text-sm leading-6 text-[#5f6d80]">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-xl bg-[#f7f9fc] px-4 py-6 text-center text-sm text-[#7b8796]">
                No moderator actions have been recorded yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#031635]">
              Moderator notes
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#7b8796]">
              Notes are stored in the audit history. Rejection reasons and user
              warnings are required.
            </p>
            <textarea
              className="mt-4 min-h-28 w-full resize-y rounded-xl border border-[#cbd3de] p-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add evidence, rationale, or student guidance…"
              value={note}
            />
            <p className="mt-1 text-right text-[10px] text-[#8a95a4]">
              {note.length}/500
            </p>
          </section>

          {(report.status === 'PENDING' ||
            report.status === 'UNDER_REVIEW') && (
            <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
              <h2 className="font-black text-[#031635]">Report workflow</h2>
              <div className="mt-4 space-y-2">
                {report.status === 'PENDING' && (
                  <ActionButton
                    busy={runningAction === 'status-under-review'}
                    icon={Clock3}
                    label="Move under review"
                    onClick={() => void runStatusAction('under-review')}
                    tone="amber"
                  />
                )}
                <ActionButton
                  busy={runningAction === 'status-reject'}
                  icon={XCircle}
                  label="Reject report"
                  onClick={() => void runStatusAction('reject')}
                  tone="rose"
                />
              </div>
            </section>
          )}

          {targetActions.length > 0 && (
            <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
              <h2 className="font-black text-[#031635]">Target actions</h2>
              <p className="mt-1 text-xs leading-5 text-[#7b8796]">
                Every action updates the report and notifies the appropriate
                students without exposing reporter identity.
              </p>
              <div className="mt-4 space-y-3">
                {targetActions.map((action) => (
                  <button
                    className={`w-full rounded-xl border p-3 text-left transition disabled:cursor-wait disabled:opacity-50 ${actionClass(action.tone)}`}
                    disabled={Boolean(runningAction)}
                    key={action.action}
                    onClick={() => void runTargetAction(action)}
                    type="button"
                  >
                    <span className="flex items-center gap-2 text-sm font-black">
                      {runningAction === `target-${action.action}` ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <action.icon className="h-4 w-4" />
                      )}
                      {action.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 opacity-80">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {report.status !== 'CLOSED' && (
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#bdc9d9] bg-white text-sm font-bold text-[#43566d] disabled:opacity-50"
              disabled={Boolean(runningAction)}
              onClick={() => void runStatusAction('close')}
              type="button"
            >
              {runningAction === 'status-close' ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Close report
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function actionsFor(report: AdminReportDetails): ActionDefinition[] {
  if (report.status === 'REJECTED' || report.status === 'CLOSED') return [];
  if (report.type === 'LISTING') {
    if (report.target.status === 'ACTIVE') {
      return [
        {
          action: 'under-review',
          label: 'Temporarily remove',
          description:
            'Move the listing under review while evidence is checked.',
          tone: 'amber',
          icon: EyeOff,
        },
        {
          action: 'block',
          label: 'Block listing',
          description:
            'Remove the listing after confirming a policy violation.',
          tone: 'rose',
          icon: Ban,
        },
      ];
    }
    if (
      report.target.status === 'UNDER_REVIEW' ||
      report.target.status === 'BLOCKED'
    ) {
      const actions: ActionDefinition[] = [
        {
          action: 'restore',
          label: 'Restore listing',
          description: 'Return this listing to the marketplace.',
          tone: 'green',
          icon: RotateCcw,
        },
      ];
      if (report.target.status === 'UNDER_REVIEW') {
        actions.unshift({
          action: 'block',
          label: 'Block listing',
          description:
            'Confirm the violation and keep the listing unavailable.',
          tone: 'rose',
          icon: Ban,
        });
      }
      return actions;
    }
  }
  if (report.type === 'REVIEW') {
    if (report.target.status === 'VISIBLE') {
      return [
        {
          action: 'under-review',
          label: 'Place under review',
          description: 'Temporarily hide this review during investigation.',
          tone: 'amber',
          icon: EyeOff,
        },
        {
          action: 'hide',
          label: 'Hide review',
          description:
            'Remove the review from reputation calculations and views.',
          tone: 'rose',
          icon: EyeOff,
        },
      ];
    }
    if (
      report.target.status === 'UNDER_REVIEW' ||
      report.target.status === 'HIDDEN'
    ) {
      const actions: ActionDefinition[] = [
        {
          action: 'restore',
          label: 'Restore review',
          description: 'Make the review visible again.',
          tone: 'green',
          icon: Eye,
        },
      ];
      if (report.target.status === 'UNDER_REVIEW') {
        actions.unshift({
          action: 'hide',
          label: 'Hide review',
          description: 'Confirm the violation and keep the review hidden.',
          tone: 'rose',
          icon: EyeOff,
        });
      }
      return actions;
    }
  }
  if (report.type === 'USER') {
    if (report.target.status === 'ACTIVE') {
      return [
        {
          action: 'warn',
          label: 'Warn student',
          description:
            'Send documented policy guidance without restricting access.',
          tone: 'amber',
          icon: ShieldAlert,
          noteRequired: true,
        },
        {
          action: 'suspend',
          label: 'Suspend account',
          description: 'Revoke active sessions and prevent marketplace access.',
          tone: 'rose',
          icon: UserX,
        },
        {
          action: 'block',
          label: 'Block account',
          description:
            'Apply the strongest account restriction for serious abuse.',
          tone: 'rose',
          icon: Ban,
        },
      ];
    }
    if (
      report.target.status === 'SUSPENDED' ||
      report.target.status === 'BLOCKED'
    ) {
      return [
        {
          action: 'reactivate',
          label: 'Reactivate account',
          description: 'Restore access after review or successful appeal.',
          tone: 'green',
          icon: UserCheck,
        },
      ];
    }
  }
  return [];
}

function ActionButton({
  icon: Icon,
  label,
  tone,
  busy,
  onClick,
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone: 'amber' | 'rose';
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-wait disabled:opacity-50 ${
        tone === 'rose'
          ? 'bg-rose-700 text-white hover:bg-rose-800'
          : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
      }`}
      disabled={busy}
      onClick={onClick}
      type="button"
    >
      {busy ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

function Detail({
  label,
  value,
  supporting,
}: {
  label: string;
  value: string;
  supporting?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.1em] text-[#7b8796]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-black text-[#273b53]">{value}</dd>
      {supporting && (
        <p className="mt-1 text-xs leading-5 text-[#7b8796]">{supporting}</p>
      )}
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
      {formatLabel(value)}
    </span>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const color =
    value === 'CRITICAL'
      ? 'bg-rose-100 text-rose-800'
      : value === 'HIGH'
        ? 'bg-orange-100 text-orange-800'
        : value === 'MEDIUM'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-700';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${color}`}>
      {formatLabel(value)} priority
    </span>
  );
}

function actionClass(tone: ActionDefinition['tone']) {
  return {
    navy: 'border-[#bac7d7] bg-[#f4f7fb] text-[#203852] hover:bg-[#eaf0f7]',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
    green:
      'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  }[tone];
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
