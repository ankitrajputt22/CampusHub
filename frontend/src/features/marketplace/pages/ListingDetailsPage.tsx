import {
  Check,
  Flag,
  Heart,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { ProductVisual } from '../components/ProductVisual';
import { listings } from '../data/mockData';

export function ListingDetailsPage() {
  const { id } = useParams();
  const listing = listings.find((item) => item.id === id);
  const [saved, setSaved] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);

  if (!listing) return <Navigate replace to="/student/marketplace" />;

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            className="flex items-center gap-3 font-bold text-[#071b33]"
            to="/student/marketplace"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-[11px] font-black">
              CH
            </span>
            Campus Hub
          </Link>
          <Link
            className="text-sm font-semibold text-cyan-800 hover:text-cyan-600"
            to="/student/marketplace"
          >
            Back to marketplace
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
              <ProductVisual listing={listing} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <button
                  aria-label={`View image ${item}`}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${item === 1 ? 'border-cyan-700' : 'border-transparent'}`}
                  key={item}
                  type="button"
                >
                  <ProductVisual compact listing={listing} />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
                  {listing.category} · {listing.condition}
                </p>
                <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                  {listing.title}
                </h1>
              </div>
              <button
                aria-label="Add to wishlist"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${saved ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-500'}`}
                onClick={() => setSaved((current) => !current)}
                title="Add to wishlist"
                type="button"
              >
                <Heart
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill={saved ? 'currentColor' : 'none'}
                />
              </button>
            </div>
            <div className="mt-5 flex items-end gap-3">
              <strong className="text-3xl font-black text-[#071b33]">
                ₹{listing.price.toLocaleString('en-IN')}
              </strong>
              {listing.originalPrice && (
                <span className="pb-1 text-sm text-slate-400 line-through">
                  ₹{listing.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="mt-5 leading-7 text-slate-600">
              {listing.description}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-5 text-sm">
              <Detail label="Pickup" value={listing.location} />
              <Detail
                label="Negotiable"
                value={listing.negotiable ? 'Yes' : 'Fixed price'}
              />
              <Detail label="Posted" value={listing.posted} />
              <Detail label="Quantity" value="1 available" />
            </dl>
            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Verified seller
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 font-bold text-emerald-800">
                  {listing.seller
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <div>
                  <p className="font-bold text-slate-900">{listing.seller}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Trust {listing.sellerTrust}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {listing.sellerRating}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#071b33] px-4 text-sm font-semibold text-white hover:bg-[#153557]"
                onClick={() => setCheckoutOpen(true)}
                type="button"
              >
                <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                Buy now
              </button>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-cyan-700"
                to="/student/chat"
              >
                <MessageSquare aria-hidden="true" className="h-4 w-4" />
                Contact seller
              </Link>
            </div>
            <button
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-700"
              type="button"
            >
              <Flag aria-hidden="true" className="h-4 w-4" />
              Report listing
            </button>
          </section>
        </div>
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          <strong>Campus safety:</strong> meet in a public campus area, inspect
          the item, and confirm handover only after you are satisfied.
        </div>
      </main>

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-cyan-700">
                  Test checkout
                </p>
                <h2
                  className="mt-1 text-xl font-bold text-slate-950"
                  id="checkout-title"
                >
                  Confirm campus pickup
                </h2>
              </div>
              <button
                aria-label="Close checkout"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setCheckoutOpen(false)}
                title="Close"
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            {ordered ? (
              <div className="py-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check aria-hidden="true" className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-bold text-slate-950">
                  Test order created
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  No real payment was processed.
                </p>
              </div>
            ) : (
              <>
                <div className="my-5 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <ProductVisual compact listing={listing} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {listing.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Pickup at {listing.location}
                    </p>
                  </div>
                  <strong className="ml-auto">
                    ₹{listing.price.toLocaleString('en-IN')}
                  </strong>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  This prototype creates a local test order. Razorpay and
                  backend payment verification will be connected later.
                </p>
                <button
                  className="mt-5 h-11 w-full rounded-lg bg-[#071b33] text-sm font-semibold text-white"
                  onClick={() => setOrdered(true)}
                  type="button"
                >
                  Create test order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800">
        {label === 'Pickup' && (
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {value}
      </dd>
    </div>
  );
}
