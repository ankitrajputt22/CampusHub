import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import {
  getSuperAdminDashboard,
  type SuperAdminDashboard,
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

export function SuperAdminDashboardPage() {
  const [dashboard, setDashboard] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setDashboard(await getSuperAdminDashboard());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingState label="Loading super admin dashboard..." />;
  if (error || !dashboard) {
    return (
      <ErrorState
        onRetry={() => void load()}
        title="Unable to load dashboard."
      />
    );
  }

  const stats = dashboard.stats;

  return (
    <>
      <PageHeader
        description="Highest-level control center for platform governance, admins, colleges, audit visibility, and global controls."
        eyebrow="Super Admin"
        title="Platform Dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Total Admins" value={stats.totalAdmins} />
        <StatCard label="Total Colleges" value={stats.totalColleges} />
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          tone="success"
        />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard
          label="Pending Reports"
          value={stats.pendingReports}
          tone="warning"
        />
        <StatCard
          label="Open Support Tickets"
          value={stats.openSupportTickets}
          tone="warning"
        />
        <StatCard
          label="Recent Admin Actions"
          value={stats.recentAdminActions}
        />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Recent Admin Actions">
          {dashboard.recentAdminActions.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentAdminActions.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1f7] p-3"
                  key={item.id}
                >
                  <div>
                    <p className="font-bold text-[#09172d]">
                      {item.actionType}
                    </p>
                    <p className="text-xs font-medium text-[#64748b]">
                      {item.actorName} on {item.targetType} #
                      {item.targetId ?? 'platform'}
                    </p>
                  </div>
                  <StatusPill value={item.actorRole} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No audit logs available.</EmptyState>
          )}
        </Panel>
        <Panel title="Quick Actions">
          <div className="grid gap-3">
            {[
              ['Add Admin', '/super-admin/admins'],
              ['Add College', '/super-admin/colleges'],
              ['View Audit Logs', '/super-admin/audit-logs'],
              ['Manage Categories', '/super-admin/categories'],
              ['Open Platform Settings', '/super-admin/platform-settings'],
            ].map(([label, to]) => (
              <Link
                className="rounded-xl border border-[#d9e2ef] px-4 py-3 text-sm font-black text-[#0f2747] hover:bg-[#f4f7fb]"
                key={to}
                to={to}
              >
                {label}
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Recent College Updates">
          {dashboard.recentCollegeUpdates.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentCollegeUpdates.map((college) => (
                <Link
                  className="block rounded-xl border border-[#edf1f7] p-3 hover:bg-[#f8fafc]"
                  key={college.id}
                  to={`/super-admin/colleges/${college.id}`}
                >
                  <p className="font-bold text-[#09172d]">{college.name}</p>
                  <p className="text-xs font-medium text-[#64748b]">
                    {college.code} · {college.city}, {college.state}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No colleges found.</EmptyState>
          )}
        </Panel>
        <Panel title="High Priority Reports">
          {dashboard.highPriorityReports.length > 0 ? (
            <div className="space-y-3">
              {dashboard.highPriorityReports.map((report) => (
                <div
                  className="rounded-xl border border-amber-100 bg-amber-50 p-3"
                  key={report.id}
                >
                  <p className="font-bold text-[#09172d]">{report.reason}</p>
                  <p className="text-xs font-medium text-[#64748b]">
                    {report.type} report by {report.reporterName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No pending reports.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
