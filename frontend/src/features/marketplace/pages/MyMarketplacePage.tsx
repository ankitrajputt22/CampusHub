import { BarChart3, Edit3, Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  PageHeader,
  StatCard,
  StatusBadge,
} from '../../student/components/StudentUi';
import { ProductVisual } from '../components/ProductVisual';
import { listings } from '../data/mockData';

const mine = [
  { ...listings[6], status: 'ACTIVE', views: 84, saves: 9 },
  { ...listings[7], status: 'ACTIVE', views: 51, saves: 6 },
  { ...listings[4], status: 'SOLD', views: 123, saves: 14 },
  { ...listings[3], status: 'DRAFT', views: 0, saves: 0 },
];

export function MyMarketplacePage() {
  const [tab, setTab] = useState('All');
  const tabs = ['All', 'Active', 'Sold', 'Drafts'];
  const statusByTab: Record<string, string> = {
    Active: 'ACTIVE',
    Sold: 'SOLD',
    Drafts: 'DRAFT',
  };
  const visible = mine.filter(
    (item) => tab === 'All' || item.status === statusByTab[tab],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link
            className="inline-flex h-10 items-center rounded-lg bg-[#071b33] px-4 text-sm font-semibold text-white"
            to="/student/sell"
          >
            Add listing
          </Link>
        }
        description="Track listings, performance, and interested buyers."
        eyebrow="Seller workspace"
        title="My Marketplace"
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          detail="2 receiving interest"
          icon={Eye}
          label="Total views"
          value="258"
        />
        <StatCard
          detail="Across active items"
          icon={BarChart3}
          label="Wishlist saves"
          tone="amber"
          value="29"
        />
        <StatCard
          detail="Last 90 days"
          icon={MoreHorizontal}
          label="Successful sales"
          tone="green"
          value="2"
        />
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 pt-3">
          {tabs.map((item) => (
            <button
              className={`min-w-20 border-b-2 px-3 py-3 text-sm font-semibold ${tab === item ? 'border-cyan-700 text-cyan-800' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              key={item}
              onClick={() => setTab(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {visible.map((item) => (
            <article
              className="grid gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center"
              key={item.id}
            >
              <div className="aspect-square overflow-hidden rounded-lg">
                <ProductVisual compact listing={item} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-950">{item.title}</h2>
                  <StatusBadge label={item.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  ₹{item.price.toLocaleString('en-IN')} · {item.views} views ·{' '}
                  {item.saves} saves
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Updated {item.posted}
                </p>
              </div>
              <div className="flex gap-2 sm:justify-end">
                <Link
                  aria-label={`View ${item.title}`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-cyan-700"
                  title="View listing"
                  to={`/listing/${item.id}`}
                >
                  <Eye aria-hidden="true" className="h-4 w-4" />
                </Link>
                <button
                  aria-label={`Edit ${item.title}`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-cyan-700"
                  title="Edit listing"
                  type="button"
                >
                  <Edit3 aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  aria-label={`More actions for ${item.title}`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-cyan-700"
                  title="More actions"
                  type="button"
                >
                  <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
