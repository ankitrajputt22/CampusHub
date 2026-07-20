import {
  Activity,
  Building2,
  Check,
  CircleDollarSign,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import {
  PageHeader,
  StatCard,
  StatusBadge,
} from '../../student/components/StudentUi';

const admins = [
  {
    name: 'Vivek Mishra',
    college: 'REC Bijnor',
    email: 'vivek.admin@recb.ac.in',
    status: 'ACTIVE',
  },
  {
    name: 'Nidhi Singh',
    college: 'REC Banda',
    email: 'nidhi.admin@recbanda.ac.in',
    status: 'ACTIVE',
  },
  {
    name: 'Farhan Ali',
    college: 'REC Kannauj',
    email: 'farhan.admin@reck.ac.in',
    status: 'INVITED',
  },
];

const colleges = [
  {
    name: 'Rajkiya Engineering College, Bijnor',
    domain: 'recb.ac.in',
    students: 742,
    status: 'ACTIVE',
  },
  {
    name: 'Rajkiya Engineering College, Banda',
    domain: 'recbanda.ac.in',
    students: 619,
    status: 'ACTIVE',
  },
  {
    name: 'Rajkiya Engineering College, Kannauj',
    domain: 'reck.ac.in',
    students: 584,
    status: 'ACTIVE',
  },
  {
    name: 'Rajkiya Engineering College, Ambedkar Nagar',
    domain: 'recabn.ac.in',
    students: 531,
    status: 'ACTIVE',
  },
];

export function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="System-wide marketplace health across verified college communities."
        eyebrow="Platform administration"
        title="Super Admin Dashboard"
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="11 active institutions"
          icon={Building2}
          label="Verified colleges"
          value="11"
        />
        <StatCard
          detail="+8.4% this month"
          icon={Users}
          label="Verified students"
          tone="green"
          value="6,842"
        />
        <StatCard
          detail="Across all colleges"
          icon={Activity}
          label="Active listings"
          tone="amber"
          value="1,476"
        />
        <StatCard
          detail="Verified transaction value"
          icon={CircleDollarSign}
          label="30-day GMV"
          tone="blue"
          value="₹8.4L"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-950">Platform activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Completed campus transactions over seven days.
              </p>
            </div>
            <TrendingUp
              aria-hidden="true"
              className="h-5 w-5 text-emerald-600"
            />
          </div>
          <div className="mt-8 flex h-56 items-end gap-3 border-b border-slate-200 px-2">
            {[42, 56, 48, 72, 63, 88, 78].map((height, index) => (
              <div
                className="flex flex-1 flex-col items-center justify-end gap-2"
                key={height}
              >
                <div
                  className="w-full max-w-12 rounded-t bg-cyan-600"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[11px] text-slate-400">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
        </article>
        <aside className="rounded-lg border border-slate-200 bg-[#ecf8f4] p-5 shadow-sm sm:p-6">
          <ShieldCheck
            aria-hidden="true"
            className="h-7 w-7 text-emerald-700"
          />
          <h2 className="mt-4 font-bold text-slate-950">Trust and safety</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            94.8% of marketplace activity completed without a report in the last
            30 days.
          </p>
          <div className="mt-5 space-y-3">
            <Metric label="Open reports" value="23" />
            <Metric label="Suspended accounts" value="8" />
            <Metric label="Refund reviews" value="5" />
          </div>
        </aside>
      </section>
    </div>
  );
}

export function SuperAdminAdminsPage() {
  const [message, setMessage] = useState('');
  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="h-10 rounded-lg bg-[#0a2038] px-4 text-sm font-semibold text-white"
            onClick={() =>
              setMessage('Admin invitation form opened in test mode.')
            }
            type="button"
          >
            Invite administrator
          </button>
        }
        description="Assign one or more administrators to verified colleges."
        eyebrow="Access control"
        title="Administrators"
      />
      {message && <Notice text={message} />}
      <SimpleTable
        columns={['Administrator', 'College', 'Email', 'Status']}
        rows={admins.map((admin) => [
          admin.name,
          admin.college,
          admin.email,
          admin.status,
        ])}
      />
    </div>
  );
}

export function SuperAdminCollegesPage() {
  const [message, setMessage] = useState('');
  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="h-10 rounded-lg bg-[#0a2038] px-4 text-sm font-semibold text-white"
            onClick={() =>
              setMessage('College onboarding form opened in test mode.')
            }
            type="button"
          >
            Add college
          </button>
        }
        description="Manage institutional identity, approved domains, and onboarding status."
        eyebrow="Platform directory"
        title="Colleges"
      />
      {message && <Notice text={message} />}
      <SimpleTable
        columns={['College', 'Approved domain', 'Students', 'Status']}
        rows={colleges.map((college) => [
          college.name,
          college.domain,
          college.students.toString(),
          college.status,
        ])}
      />
    </div>
  );
}

export function SuperAdminAnalyticsPage() {
  const metrics = [
    { label: 'REC Bijnor', listings: 186, conversion: 31 },
    { label: 'REC Banda', listings: 142, conversion: 28 },
    { label: 'REC Kannauj', listings: 128, conversion: 34 },
    { label: 'REC Ambedkar Nagar', listings: 117, conversion: 25 },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        description="Compare marketplace adoption and successful handovers by college."
        eyebrow="Platform intelligence"
        title="Analytics"
      />
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-bold text-slate-950">
          College marketplace comparison
        </h2>
        <div className="mt-6 space-y-5">
          {metrics.map((metric) => (
            <div
              className="grid gap-2 sm:grid-cols-[190px_1fr_90px] sm:items-center"
              key={metric.label}
            >
              <p className="text-sm font-semibold text-slate-800">
                {metric.label}
              </p>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-600"
                  style={{ width: `${metric.listings / 2}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 sm:text-right">
                {metric.listings} listings
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <AnalyticsCard
          label="Avg. order value"
          value="₹1,840"
          detail="+6.2% month over month"
        />
        <AnalyticsCard
          label="Handover completion"
          value="82%"
          detail="1,118 completed orders"
        />
        <AnalyticsCard
          label="Report resolution"
          value="11.4h"
          detail="Median resolution time"
        />
      </section>
    </div>
  );
}

export function SuperAdminSettingsPage() {
  const [values, setValues] = useState({
    onboarding: true,
    crossCollege: true,
    maintenance: false,
    reports: true,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        description="Control platform-wide behavior. These switches are local test controls only."
        eyebrow="System configuration"
        title="Platform settings"
      />
      <section className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
        <Toggle
          checked={values.onboarding}
          description="Allow new verified college domains to accept student signups."
          label="Student onboarding"
          onChange={(checked) => setValues({ ...values, onboarding: checked })}
        />
        <Toggle
          checked={values.crossCollege}
          description="Allow public browsing through Explore Other Colleges."
          label="Cross-college discovery"
          onChange={(checked) =>
            setValues({ ...values, crossCollege: checked })
          }
        />
        <Toggle
          checked={values.reports}
          description="Accept and route new listing and user reports."
          label="Safety reports"
          onChange={(checked) => setValues({ ...values, reports: checked })}
        />
        <Toggle
          checked={values.maintenance}
          description="Show a maintenance screen and pause marketplace actions."
          label="Maintenance mode"
          onChange={(checked) => setValues({ ...values, maintenance: checked })}
        />
      </section>
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="px-5 py-3" key={column}>
                  {column}
                </th>
              ))}
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell, index) => (
                  <td
                    className={`px-5 py-4 ${index === 0 ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
                    key={cell}
                  >
                    {index === row.length - 1 ? (
                      <StatusBadge label={cell} />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
                <td className="px-5 py-4 text-right">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                    type="button"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-emerald-200 pb-3 text-sm last:border-0">
      <span className="text-slate-600">{label}</span>
      <strong className="text-slate-950">{value}</strong>
    </div>
  );
}
function AnalyticsCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
function Notice({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
      <Check aria-hidden="true" className="h-4 w-4" />
      {text}
    </div>
  );
}
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 p-5">
      <span>
        <span className="block font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-cyan-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
