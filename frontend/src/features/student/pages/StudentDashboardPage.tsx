import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Heart,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ListingCard } from '../../marketplace/components/ListingCard';
import { listings } from '../../marketplace/data/mockData';
import { getCampusUser } from '../lib/session';
import { PageHeader, SectionHeading, StatCard } from '../components/StudentUi';

export function StudentDashboardPage() {
  const user = getCampusUser();

  return (
    <div className="space-y-7">
      <PageHeader
        action={
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#071b33] px-4 text-sm font-semibold text-white hover:bg-[#153557]"
            to="/student/sell"
          >
            <Store aria-hidden="true" className="h-4 w-4" />
            Sell an item
          </Link>
        }
        description={`You are browsing ${user.collegeName}. Here is what is happening in your campus marketplace.`}
        eyebrow="Student dashboard"
        title={`Welcome back, ${user.fullName.split(' ')[0]}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="2 receiving interest"
          icon={Store}
          label="Active listings"
          tone="cyan"
          value="4"
        />
        <StatCard
          detail="1 item is ready"
          icon={PackageCheck}
          label="Orders"
          tone="amber"
          value="3"
        />
        <StatCard
          detail="Saved for later"
          icon={Heart}
          label="Wishlist"
          tone="green"
          value="7"
        />
        <StatCard
          detail="This semester"
          icon={ShoppingBag}
          label="Items sold"
          tone="blue"
          value="2"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Campus Trust Score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <strong className="text-4xl font-black text-[#071b33]">
                  {user.trustScore}
                </strong>
                <span className="pb-1 text-sm font-medium text-slate-500">
                  / 100 · New student
                </span>
              </div>
            </div>
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[7px] border-cyan-100 bg-white text-cyan-800">
              <ShieldCheck aria-hidden="true" className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-cyan-600"
              style={{ width: `${user.trustScore}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2 text-slate-600">
              <CheckCircle2
                aria-hidden="true"
                className="h-4 w-4 text-emerald-600"
              />
              College email verified
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <CheckCircle2
                aria-hidden="true"
                className="h-4 w-4 text-emerald-600"
              />
              Phone number verified
            </p>
          </div>
          <Link
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-cyan-800 hover:text-cyan-600"
            to="/student/profile"
          >
            Complete your profile{' '}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </article>

        <aside className="rounded-lg border border-slate-200 bg-[#fff8e8] p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-950">Recent updates</h2>
            <Bell aria-hidden="true" className="h-5 w-5 text-amber-700" />
          </div>
          <div className="mt-4 space-y-4">
            <Activity
              title="Order ready for pickup"
              detail="Mathematics book set · 8 min ago"
            />
            <Activity
              title="New wishlist save"
              detail="Your calculator · 42 min ago"
            />
            <Activity
              title="Payment confirmed"
              detail="Order CH-240718 · Yesterday"
            />
          </div>
          <Link
            className="mt-5 block text-sm font-semibold text-amber-800 hover:text-amber-600"
            to="/student/notifications"
          >
            View all notifications
          </Link>
        </aside>
      </section>

      <section className="space-y-4">
        <SectionHeading
          description="Recently posted by verified students at your college."
          link={{ label: 'Browse marketplace', to: '/student/marketplace' }}
          title="Fresh on campus"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {listings.slice(0, 4).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Activity({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-l-2 border-amber-300 pl-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}
