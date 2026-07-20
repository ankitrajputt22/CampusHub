import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Heart,
  MapPin,
  PackageCheck,
  Send,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ProductVisual } from '../../marketplace/components/ProductVisual';
import {
  initialNotifications,
  listings,
  orders,
} from '../../marketplace/data/mockData';
import type { CampusNotification } from '../../marketplace/data/mockData';
import {
  PageHeader,
  SectionHeading,
  StatusBadge,
} from '../components/StudentUi';

export function OrdersPage() {
  const [tab, setTab] = useState<'Bought' | 'Sold'>('Bought');
  const visible = orders.filter((order) => order.role === tab);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Follow campus pickups and keep buying and selling activity in one place."
        eyebrow="Transactions"
        title="Orders"
      />
      <SegmentedControl
        onChange={(value) => setTab(value as 'Bought' | 'Sold')}
        options={['Bought', 'Sold']}
        value={tab}
      />
      <div className="space-y-4">
        {visible.map((order) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            key={order.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <ProductVisual compact listing={order.listing} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-950">
                    {order.listing.title}
                  </h2>
                  <StatusBadge label={order.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Order {order.id} · {order.date}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  Campus pickup at {order.listing.location}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-lg font-black text-slate-950">
                  ₹{order.listing.price.toLocaleString('en-IN')}
                </p>
                <button
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-800 hover:text-cyan-600"
                  type="button"
                >
                  View order{' '}
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
            {order.status === 'READY_FOR_PICKUP' && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Confirm only after inspecting and receiving the item.
                </span>
                <button
                  className="h-9 rounded-lg bg-amber-900 px-4 text-xs font-semibold text-white"
                  type="button"
                >
                  Confirm handover
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export function WishlistPage() {
  const [savedIds, setSavedIds] = useState(() =>
    listings.slice(0, 4).map((listing) => listing.id),
  );
  const savedListings = listings.filter((listing) =>
    savedIds.includes(listing.id),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="Keep useful campus finds together and move when the price feels right."
        eyebrow="Saved items"
        title="Wishlist"
      />
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-950">{savedListings.length}</strong>{' '}
            items saved
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {savedListings.map((listing) => (
            <article
              className="grid gap-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center"
              key={listing.id}
            >
              <div className="aspect-square overflow-hidden rounded-lg">
                <ProductVisual compact listing={listing} />
              </div>
              <div className="min-w-0">
                <Link
                  className="font-bold text-slate-950 hover:text-cyan-800"
                  to={`/listing/${listing.id}`}
                >
                  {listing.title}
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  {listing.condition} · {listing.location}
                </p>
                <p className="mt-2 font-black text-slate-950">
                  ₹{listing.price.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  className="inline-flex h-10 items-center rounded-lg bg-[#071b33] px-4 text-sm font-semibold text-white"
                  to={`/listing/${listing.id}`}
                >
                  View item
                </Link>
                <button
                  aria-label={`Remove ${listing.title}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
                  onClick={() =>
                    setSavedIds((current) =>
                      current.filter((id) => id !== listing.id),
                    )
                  }
                  title="Remove from wishlist"
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {savedListings.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Heart
                aria-hidden="true"
                className="mx-auto h-9 w-9 text-slate-300"
              />
              <h2 className="mt-3 font-bold text-slate-900">
                Your wishlist is clear
              </h2>
              <Link
                className="mt-3 inline-block text-sm font-semibold text-cyan-800"
                to="/student/marketplace"
              >
                Browse marketplace
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const transactions = [
  {
    id: 'PAY-82941',
    label: 'Engineering Mathematics book set',
    date: '18 Jul 2026',
    amount: 680,
    status: 'SUCCESS',
  },
  {
    id: 'PAY-81772',
    label: 'Sony wireless headphones',
    date: '03 Jul 2026',
    amount: 1500,
    status: 'SUCCESS',
  },
  {
    id: 'PAY-80114',
    label: 'Hostel starter bundle',
    date: '21 Jun 2026',
    amount: 1100,
    status: 'PENDING',
  },
];

export function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="A test view of marketplace payments. Sensitive card or UPI details are never stored here."
        eyebrow="Payment activity"
        title="Payments"
      />
      <section className="grid gap-4 md:grid-cols-3">
        <PaymentStat
          icon={CircleDollarSign}
          label="Total spent"
          value="₹2,180"
        />
        <PaymentStat icon={CreditCard} label="Successful payments" value="2" />
        <PaymentStat icon={Clock3} label="Pending" value="₹1,100" />
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-950">Payment history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Transaction</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {payment.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{payment.id}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{payment.date}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge label={payment.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className="text-sm font-semibold text-cyan-800"
                      type="button"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
        <ShieldCheck aria-hidden="true" className="mr-2 inline h-4 w-4" />
        Real payments will be created and verified by the backend before an
        order is marked paid.
      </div>
    </div>
  );
}

export function ReviewsPage() {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        description="Reviews are tied to completed orders so campus reputation stays meaningful."
        eyebrow="Community reputation"
        title="Reviews"
      />
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-amber-700">
            Review pending
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">
            Sony wireless headphones
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Order CH-240703 · Seller Aditya Kumar
          </p>
          {submitted ? (
            <div className="mt-6 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              <Check aria-hidden="true" className="h-5 w-5" />
              Review submitted for testing.
            </div>
          ) : (
            <>
              <div className="mt-6 flex gap-2" aria-label="Choose rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    aria-label={`${value} star rating`}
                    className="rounded-lg p-1"
                    key={value}
                    onClick={() => setRating(value)}
                    type="button"
                  >
                    <Star
                      aria-hidden="true"
                      className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="mt-4 min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                placeholder="Share a useful, respectful review"
              />
              <button
                className="mt-4 h-10 rounded-lg bg-[#071b33] px-4 text-sm font-semibold text-white disabled:bg-slate-300"
                disabled={rating === 0}
                onClick={() => setSubmitted(true)}
                type="button"
              >
                Submit review
              </button>
            </>
          )}
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            description="Feedback from your completed campus deals."
            title="Your review history"
          />
          <div className="mt-5 space-y-5">
            <ReviewHistory
              name="Priya Verma"
              item="Engineering Mathematics book set"
              rating={5}
              text="Books were exactly as described and pickup was easy."
            />
            <ReviewHistory
              name="Naman Gupta"
              item="Basic electronics lab kit"
              rating={4}
              text="Useful kit and a smooth handover near the lab block."
            />
          </div>
        </article>
      </section>
    </div>
  );
}

export function NotificationsPage() {
  const [items, setItems] =
    useState<CampusNotification[]>(initialNotifications);
  const unread = items.filter((item) => !item.read).length;
  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700"
            onClick={() =>
              setItems((current) =>
                current.map((item) => ({ ...item, read: true })),
              )
            }
            type="button"
          >
            <CheckCheck aria-hidden="true" className="h-4 w-4" />
            Mark all read
          </button>
        }
        description={`${unread} unread updates across orders, payments, listings, and your account.`}
        eyebrow="Inbox"
        title="Notifications"
      />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <button
              className={`flex w-full items-start gap-4 p-4 text-left sm:p-5 ${item.read ? 'bg-white' : 'bg-cyan-50/60'}`}
              key={item.id}
              onClick={() =>
                setItems((current) =>
                  current.map((notice) =>
                    notice.id === item.id ? { ...notice, read: true } : notice,
                  ),
                )
              }
              type="button"
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${notificationTone(item.type)}`}
              >
                <NotificationIcon type={item.type} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="text-sm text-slate-950">
                    {item.title}
                  </strong>
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-cyan-600" />
                  )}
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  {item.body}
                </span>
                <span className="mt-2 block text-xs text-slate-400">
                  {item.time}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const conversations = [
  {
    id: 1,
    name: 'Priya Verma',
    listing: 'Mathematics book set',
    message: 'I can meet near the Academic Block.',
    time: '10:42',
    unread: 2,
  },
  {
    id: 2,
    name: 'Rahul Yadav',
    listing: 'Campus bicycle',
    message: 'Yes, you can inspect it this evening.',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 3,
    name: 'Sana Khan',
    listing: 'Study table and chair',
    message: 'The table is still available.',
    time: 'Mon',
    unread: 0,
  },
];

export function ChatPage() {
  const [activeId, setActiveId] = useState(1);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    'Hi, is the book set still available?',
    'Yes, it is available. I can meet near the Academic Block.',
  ]);
  const active =
    conversations.find((item) => item.id === activeId) ?? conversations[0];

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((current) => [...current, draft.trim()]);
    setDraft('');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Test buyer and seller conversations before real-time messaging is connected."
        eyebrow="Messages"
        title="Campus chat"
      />
      <section className="grid min-h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <input
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-600"
              placeholder="Search conversations"
            />
          </div>
          <div>
            {conversations.map((conversation) => (
              <button
                className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left ${activeId === conversation.id ? 'bg-cyan-50' : 'hover:bg-slate-50'}`}
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                type="button"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-700">
                  {conversation.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-3">
                    <strong className="truncate text-sm text-slate-900">
                      {conversation.name}
                    </strong>
                    <span className="shrink-0 text-xs text-slate-400">
                      {conversation.time}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs font-medium text-cyan-800">
                    {conversation.listing}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="truncate text-xs text-slate-500">
                      {conversation.message}
                    </span>
                    {conversation.unread > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1 text-[10px] font-bold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <div className="flex min-h-[520px] flex-col">
          <header className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-950">{active.name}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {active.listing} · verified student
            </p>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] p-5">
            {messages.map((message, index) => (
              <div
                className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                key={`${message}-${index}`}
              >
                <p
                  className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${index % 2 === 0 ? 'bg-[#071b33] text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
                >
                  {message}
                </p>
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-slate-200 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              aria-label="Message"
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message"
              value={draft}
            />
            <button
              aria-label="Send message"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#071b33] text-white disabled:bg-slate-300"
              disabled={!draft.trim()}
              title="Send message"
              type="submit"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {options.map((option) => (
        <button
          className={`h-9 min-w-28 rounded-md px-4 text-sm font-semibold ${option === value ? 'bg-[#071b33] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
function PaymentStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </article>
  );
}
function ReviewHistory({
  name,
  item,
  rating,
  text,
}: {
  name: string;
  item: string;
  rating: number;
  text: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="mt-1 text-xs text-slate-500">{item}</p>
        </div>
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
              key={value}
            />
          ))}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
function NotificationIcon({ type }: { type: CampusNotification['type'] }) {
  if (type === 'order') return <PackageCheck className="h-5 w-5" />;
  if (type === 'payment') return <CreditCard className="h-5 w-5" />;
  if (type === 'listing') return <Heart className="h-5 w-5" />;
  return <Bell className="h-5 w-5" />;
}
function notificationTone(type: CampusNotification['type']) {
  if (type === 'order') return 'bg-amber-100 text-amber-800';
  if (type === 'payment') return 'bg-emerald-100 text-emerald-800';
  if (type === 'listing') return 'bg-rose-100 text-rose-800';
  return 'bg-blue-100 text-blue-800';
}
