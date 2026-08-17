import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getSuperAdminAdmin,
  removeSuperAdminAdminRole,
  type AdminDetails,
} from '../api/superAdminApi';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusPill,
} from '../components/SuperAdminUi';

export function SuperAdminAdminDetailsPage() {
  const { adminId } = useParams();
  const [details, setDetails] = useState<AdminDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    setError(false);
    try {
      setDetails(await getSuperAdminAdmin(adminId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeRole() {
    if (!adminId || details?.admin.role === 'SUPER_ADMIN') return;
    const currentDetails = details;
    if (!currentDetails) return;
    const confirmed = window.confirm(
      `Remove admin role from ${currentDetails.admin.fullName}?`,
    );
    if (!confirmed) return;
    await removeSuperAdminAdminRole(adminId);
    setMessage('Admin role removed successfully.');
    await load();
  }

  if (loading) return <LoadingState label="Loading admin details..." />;
  if (error || !details) {
    return (
      <ErrorState
        onRetry={() => void load()}
        title="Unable to load admin details."
      />
    );
  }

  return (
    <>
      <PageHeader
        action={
          <Link
            className="rounded-xl border border-[#d7dfeb] px-4 py-3 text-sm font-black"
            to="/super-admin/admins"
          >
            Back to Admins
          </Link>
        }
        description="Review admin account status, audit activity, and ownership controls."
        eyebrow="Admin Details"
        title={details.admin.fullName}
      />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Panel title="Admin Profile">
          <div className="space-y-3 text-sm">
            <Detail label="Email" value={details.admin.email} />
            <Detail label="Username" value={details.admin.username} />
            <Detail label="Role" value={details.admin.role.replace('_', ' ')} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">
                Status
              </p>
              <div className="mt-1">
                <StatusPill value={details.admin.status} />
              </div>
            </div>
            <Detail
              label="Created By"
              value={details.admin.createdByName ?? 'System'}
            />
            <Detail
              label="Last Login"
              value={
                details.admin.lastLoginAt
                  ? new Date(details.admin.lastLoginAt).toLocaleString()
                  : 'Not recorded'
              }
            />
          </div>
          {details.admin.role !== 'SUPER_ADMIN' && (
            <button
              className="mt-5 h-11 w-full rounded-xl border border-rose-200 bg-rose-50 text-sm font-black text-rose-700"
              onClick={() => void removeRole()}
              type="button"
            >
              Remove Admin Role
            </button>
          )}
          {message && (
            <p className="mt-3 text-sm font-bold text-[#475569]">{message}</p>
          )}
        </Panel>
        <Panel title="Recent Audit Logs">
          {details.recentAuditLogs.length > 0 ? (
            <div className="space-y-3">
              {details.recentAuditLogs.map((item) => (
                <div
                  className="rounded-xl border border-[#edf1f7] p-3"
                  key={item.id}
                >
                  <p className="font-bold text-[#09172d]">{item.actionType}</p>
                  <p className="text-xs font-medium text-[#64748b]">
                    {item.targetType} #{item.targetId ?? 'platform'} ·{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No audit logs available.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">
        {label}
      </p>
      <p className="mt-1 font-bold text-[#09172d]">{value}</p>
    </div>
  );
}
