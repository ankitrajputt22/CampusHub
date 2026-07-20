import { Check, Filter, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader, StatusBadge } from '../../student/components/StudentUi';

type Section =
  | 'users'
  | 'colleges'
  | 'listings'
  | 'reports'
  | 'orders'
  | 'payments'
  | 'reviews'
  | 'categories';

const sectionConfig: Record<
  Section,
  {
    title: string;
    eyebrow: string;
    description: string;
    columns: string[];
    rows: string[][];
    action?: string;
  }
> = {
  users: {
    title: 'Users',
    eyebrow: 'Account management',
    description:
      'Review verification, trust signals, and account status for your college.',
    columns: ['Student', 'Branch', 'Trust score', 'Status'],
    rows: [
      ['Aarav Sharma|aarav@recb.ac.in', 'Computer Science', '82', 'ACTIVE'],
      [
        'Meera Singh|meera@recb.ac.in',
        'Electrical Engineering',
        '61',
        'ACTIVE',
      ],
      ['Kabir Ansari|kabir@recb.ac.in', 'Civil Engineering', '30', 'PENDING'],
      [
        'Ritika Verma|ritika@recb.ac.in',
        'Information Technology',
        '76',
        'SUSPENDED',
      ],
    ],
  },
  colleges: {
    title: 'College profile',
    eyebrow: 'Verified institution',
    description:
      'Maintain the public college record and approved email domain.',
    columns: ['College', 'Email domain', 'Students', 'Status'],
    rows: [
      [
        'Rajkiya Engineering College, Bijnor|Bijnor, Uttar Pradesh',
        'recb.ac.in',
        '742',
        'ACTIVE',
      ],
    ],
    action: 'Request domain update',
  },
  listings: {
    title: 'Listings',
    eyebrow: 'Marketplace moderation',
    description:
      'Inspect active, reported, and under-review marketplace items.',
    columns: ['Listing', 'Seller', 'Price', 'Status'],
    rows: [
      [
        'HP laptop, i5 11th Gen|Electronics',
        'Mohit Singh',
        '₹28,500',
        'UNDER REVIEW',
      ],
      ['Campus bicycle|Bicycles', 'Rahul Yadav', '₹4,200', 'ACTIVE'],
      [
        'Hostel starter bundle|Hostel Essentials',
        'Kritika Joshi',
        '₹1,100',
        'FLAGGED',
      ],
      ['Mathematics book set|Books', 'Priya Verma', '₹680', 'ACTIVE'],
    ],
  },
  reports: {
    title: 'Reports',
    eyebrow: 'Safety queue',
    description:
      'Investigate student reports and record a clear moderation outcome.',
    columns: ['Report', 'Reason', 'Submitted', 'Status'],
    rows: [
      [
        'RPT-1048|HP laptop listing',
        'Suspicious pricing',
        '20 Jul 2026',
        'OPEN',
      ],
      [
        'RPT-1047|Hostel bundle',
        'Duplicate listing',
        '19 Jul 2026',
        'IN REVIEW',
      ],
      [
        'RPT-1042|User: R. Kumar',
        'Abusive messages',
        '17 Jul 2026',
        'RESOLVED',
      ],
    ],
  },
  orders: {
    title: 'Orders',
    eyebrow: 'Campus transactions',
    description: 'Track order status and step in when a handover is disputed.',
    columns: ['Order', 'Buyer / Seller', 'Amount', 'Status'],
    rows: [
      [
        'CH-240718|Mathematics book set',
        'Ankit / Priya',
        '₹680',
        'READY FOR PICKUP',
      ],
      [
        'CH-240703|Wireless headphones',
        'Ankit / Aditya',
        '₹1,500',
        'COMPLETED',
      ],
      ['CH-240621|Hostel bundle', 'Neha / Ankit', '₹1,100', 'PAID'],
      ['CH-240612|Study table', 'Rohan / Sana', '₹1,800', 'DISPUTED'],
    ],
  },
  payments: {
    title: 'Payments',
    eyebrow: 'Transaction monitoring',
    description:
      'View payment verification and refund status without exposing sensitive payment data.',
    columns: ['Payment', 'Order', 'Amount', 'Status'],
    rows: [
      ['PAY-82941|18 Jul 2026', 'CH-240718', '₹680', 'SUCCESS'],
      ['PAY-81772|03 Jul 2026', 'CH-240703', '₹1,500', 'SUCCESS'],
      ['PAY-80114|21 Jun 2026', 'CH-240621', '₹1,100', 'PENDING'],
      ['PAY-79510|12 Jun 2026', 'CH-240612', '₹1,800', 'REFUND REVIEW'],
    ],
  },
  reviews: {
    title: 'Reviews',
    eyebrow: 'Community reputation',
    description:
      'Moderate order-linked feedback while preserving honest student experiences.',
    columns: ['Review', 'Order', 'Rating', 'Status'],
    rows: [
      [
        'Priya Verma → Ankit|Books were exactly as described.',
        'CH-240718',
        '5 / 5',
        'PUBLISHED',
      ],
      [
        'Ankit → Aditya|Smooth pickup and good condition.',
        'CH-240703',
        '4 / 5',
        'PUBLISHED',
      ],
      [
        'Rohan → Sana|Item differed from description.',
        'CH-240612',
        '2 / 5',
        'FLAGGED',
      ],
    ],
  },
  categories: {
    title: 'Categories',
    eyebrow: 'Marketplace structure',
    description:
      'Organize the category choices available when students publish listings.',
    columns: ['Category', 'Active listings', 'Sort order', 'Status'],
    rows: [
      ['Books', '48', '1', 'ACTIVE'],
      ['Electronics', '37', '2', 'ACTIVE'],
      ['Hostel Essentials', '29', '3', 'ACTIVE'],
      ['Bicycles', '18', '4', 'ACTIVE'],
      ['Lab Equipment', '15', '5', 'ACTIVE'],
    ],
    action: 'Add category',
  },
};

export function AdminUsersPage() {
  return <AdminSectionPage section="users" />;
}
export function AdminCollegesPage() {
  return <AdminSectionPage section="colleges" />;
}
export function AdminListingsPage() {
  return <AdminSectionPage section="listings" />;
}
export function AdminReportsPage() {
  return <AdminSectionPage section="reports" />;
}
export function AdminOrdersPage() {
  return <AdminSectionPage section="orders" />;
}
export function AdminPaymentsPage() {
  return <AdminSectionPage section="payments" />;
}
export function AdminReviewsPage() {
  return <AdminSectionPage section="reviews" />;
}
export function AdminCategoriesPage() {
  return <AdminSectionPage section="categories" />;
}

function AdminSectionPage({ section }: { section: Section }) {
  const config = sectionConfig[section];
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const visibleRows = useMemo(
    () =>
      config.rows.filter((row) =>
        row.join(' ').toLowerCase().includes(query.toLowerCase()),
      ),
    [config.rows, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          config.action && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0a2038] px-4 text-sm font-semibold text-white"
              onClick={() =>
                setMessage(`${config.action} opened in test mode.`)
              }
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {config.action}
            </button>
          )
        }
        description={config.description}
        eyebrow={config.eyebrow}
        title={config.title}
      />
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <Check aria-hidden="true" className="h-4 w-4" />
          {message}
        </div>
      )}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-cyan-600"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}`}
              value={query}
            />
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700"
            type="button"
          >
            <Filter aria-hidden="true" className="h-4 w-4" />
            Filter
          </button>
          <button
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700"
            type="button"
          >
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                {config.columns.map((column) => (
                  <th className="px-5 py-3" key={column}>
                    {column}
                  </th>
                ))}
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr key={row.join('-')}>
                  {row.map((cell, index) => (
                    <td className="px-5 py-4" key={cell}>
                      {index === 0 ? (
                        <PrimaryCell value={cell} />
                      ) : index === row.length - 1 ? (
                        <StatusBadge label={cell} />
                      ) : (
                        <span
                          className={
                            index === 2
                              ? 'font-semibold text-slate-900'
                              : 'text-slate-600'
                          }
                        >
                          {cell}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-4 text-right">
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                      onClick={() =>
                        setMessage(
                          `Opened ${row[0].split('|')[0]} in test mode.`,
                        )
                      }
                      type="button"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          <span>{visibleRows.length} records</span>
          <span>Page 1 of 1</span>
        </div>
      </section>
    </div>
  );
}

function PrimaryCell({ value }: { value: string }) {
  const [title, detail] = value.split('|');
  return (
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      {detail && (
        <p className="mt-1 max-w-sm truncate text-xs text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}
