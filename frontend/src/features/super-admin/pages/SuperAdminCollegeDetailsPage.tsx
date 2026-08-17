import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  activateSuperAdminCollege,
  blockSuperAdminCollege,
  deactivateSuperAdminCollege,
  getSuperAdminCollege,
  type CollegeDetails,
} from '../api/superAdminApi';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from '../components/SuperAdminUi';

export function SuperAdminCollegeDetailsPage() {
  const { collegeId } = useParams();
  const [details, setDetails] = useState<CollegeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    if (!collegeId) return;
    setLoading(true);
    setError(false);
    try {
      setDetails(await getSuperAdminCollege(collegeId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [collegeId]);

  async function setStatus(status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') {
    if (!collegeId || !details) return;
    const confirmed = window.confirm(`Change ${details.college.name} to ${status}?`);
    if (!confirmed) return;
    if (status === 'ACTIVE') await activateSuperAdminCollege(collegeId);
    if (status === 'INACTIVE') await deactivateSuperAdminCollege(collegeId);
    if (status === 'BLOCKED') await blockSuperAdminCollege(collegeId);
    setMessage('College updated successfully.');
    await load();
  }

  if (loading) return <LoadingState label="Loading college details..." />;
  if (error || !details) {
    return <ErrorState onRetry={() => void load()} title="Unable to load college." />;
  }

  return (
    <>
      <PageHeader
        action={<Link className="rounded-xl border border-[#d7dfeb] px-4 py-3 text-sm font-black" to="/super-admin/colleges">Back to Colleges</Link>}
        description="College status changes are soft controls and never delete existing users or listings."
        eyebrow="College Details"
        title={details.college.name}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Verified Students" value={details.college.verifiedStudentsCount} />
        <StatCard label="Active Listings" value={details.college.activeListingsCount} />
        <StatCard label="Active Users" value={details.activeUsers} />
        <StatCard label="Orders" value={details.totalOrders} />
        <StatCard label="Reports" value={details.reportsCount} tone="warning" />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
        <Panel title="College Summary">
          <div className="space-y-3 text-sm">
            <Detail label="Code" value={details.college.code} />
            <Detail label="Location" value={`${details.college.city}, ${details.college.state}, ${details.college.country}`} />
            <Detail label="Email Domain" value={details.college.emailDomain ?? 'Optional'} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">Status</p>
              <div className="mt-1"><StatusPill value={details.college.status} /></div>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <button className="h-10 rounded-xl bg-emerald-700 text-sm font-black text-white" onClick={() => void setStatus('ACTIVE')} type="button">Mark Active</button>
            <button className="h-10 rounded-xl border border-[#d7dfeb] text-sm font-black" onClick={() => void setStatus('INACTIVE')} type="button">Mark Inactive</button>
            <button className="h-10 rounded-xl border border-rose-200 bg-rose-50 text-sm font-black text-rose-700" onClick={() => void setStatus('BLOCKED')} type="button">Block College</button>
          </div>
          {message && <p className="mt-3 text-sm font-bold text-[#475569]">{message}</p>}
        </Panel>
        <Panel title="Audit History">
          {details.auditHistory.length > 0 ? (
            <div className="space-y-3">
              {details.auditHistory.map((item) => (
                <div className="rounded-xl border border-[#edf1f7] p-3" key={item.id}>
                  <p className="font-bold text-[#09172d]">{item.actionType}</p>
                  <p className="text-xs text-[#64748b]">{item.actorName} · {new Date(item.createdAt).toLocaleString()}</p>
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
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="mt-1 font-bold text-[#09172d]">{value}</p>
    </div>
  );
}
