import {
  AlertTriangle,
  Building2,
  ListChecks,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  PageHeader,
  StatCard,
  StatusBadge,
} from '../../student/components/StudentUi';

const queue = [
  {
    name: 'Aarav Sharma',
    email: 'aarav@recb.ac.in',
    branch: 'Computer Science',
    status: 'Email verified',
  },
  {
    name: 'Meera Singh',
    email: 'meera@recb.ac.in',
    branch: 'Electrical Engineering',
    status: 'Phone pending',
  },
  {
    name: 'Kabir Ansari',
    email: 'kabir@recb.ac.in',
    branch: 'Civil Engineering',
    status: 'Manual review',
  },
];

const alerts = [
  {
    title: 'High-value laptop listing',
    detail: 'Receipt check requested',
    status: 'HIGH',
  },
  {
    title: 'Duplicate hostel bundle',
    detail: 'Reported by two students',
    status: 'MEDIUM',
  },
  {
    title: 'New college domain request',
    detail: 'Awaiting super-admin review',
    status: 'PENDING',
  },
];

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Monitor verification, listings, and marketplace safety for Rajkiya Engineering College, Bijnor."
        eyebrow="College administration"
        title="Dashboard"
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="6 added today"
          icon={ShieldCheck}
          label="Pending verification"
          value="18"
        />
        <StatCard
          detail="42 active this week"
          icon={Users}
          label="Verified students"
          tone="green"
          value="742"
        />
        <StatCard
          detail="9 flagged"
          icon={ListChecks}
          label="Listings in review"
          tone="amber"
          value="31"
        />
        <StatCard
          detail="Needs attention"
          icon={AlertTriangle}
          label="Open reports"
          tone="blue"
          value="7"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-950">
                Student verification queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Newest accounts requiring review.
              </p>
            </div>
            <button
              className="text-sm font-semibold text-cyan-800"
              type="button"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((student) => (
                  <tr key={student.email}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {student.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {student.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {student.branch}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge label={student.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                        type="button"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Moderation watchlist</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <button
                className="w-full rounded-lg border border-slate-200 p-4 text-left hover:border-cyan-600"
                key={alert.title}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {alert.title}
                  </span>
                  <StatusBadge label={alert.status} />
                </div>
                <span className="mt-2 block text-sm text-slate-500">
                  {alert.detail}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </section>
      <section className="rounded-lg border border-slate-200 bg-[#eaf7f5] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700">
            <Building2 aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-950">
              REC Bijnor marketplace health
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              96.2% of active listings have no reports, with a 4.7 average
              seller rating.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
