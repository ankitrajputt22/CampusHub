import { useEffect, useState } from 'react';

import {
  getSuperAdminAuditLogs,
  type AuditLogItem,
} from '../api/superAdminApi';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusPill,
} from '../components/SuperAdminUi';

export function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setLogs((await getSuperAdminAuditLogs(search ? { search } : undefined)).items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingState label="Loading audit logs..." />;
  if (error) return <ErrorState onRetry={() => void load()} title="Unable to load audit logs." />;

  return (
    <>
      <PageHeader
        action={
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <input
              className="h-11 rounded-xl border border-[#d7dfeb] px-4 text-sm font-semibold outline-none focus:border-rose-600"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search audit logs"
              value={search}
            />
            <button className="rounded-xl bg-[#111827] px-4 text-sm font-black text-white" type="submit">
              Search
            </button>
          </form>
        }
        description="Read-only platform audit history for admin, moderation, category, college, and settings changes."
        eyebrow="Audit"
        title="Audit Logs"
      />
      <Panel title="Platform Audit History">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                <tr>
                  <th className="py-3">Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 font-black text-[#0f2747]">{log.actionType}</td>
                    <td>
                      <p className="font-bold">{log.actorName}</p>
                      <StatusPill value={log.actorRole} />
                    </td>
                    <td>{log.targetType} #{log.targetId ?? 'platform'}</td>
                    <td>{log.oldValue ?? '-'}</td>
                    <td>{log.newValue ?? '-'}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No audit logs available.</EmptyState>
        )}
      </Panel>
    </>
  );
}
