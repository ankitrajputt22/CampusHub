import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  CalendarDays,
  Flag,
  Heart,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  addListingToWishlist,
  getMarketplaceListing,
  initiateMarketplaceOrder,
  removeListingFromWishlist,
  reportMarketplaceListing,
  type ListingReportReason,
  type MarketplaceListing,
  type OrderInitiation,
  type ProductDetails,
} from '../api/marketplaceApi';
import { BuyNowModal } from '../components/BuyNowModal';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { ReportListingModal } from '../components/ReportListingModal';
import { SellerInfoCard } from '../components/SellerInfoCard';
import { SimilarListings } from '../components/SimilarListings';
import {
  conditionLabel,
  formatPrice,
  relativeTime,
} from '../lib/marketplaceFormatters';

export function ListingDetailsPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [wishlistBusyIds, setWishlistBusyIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderInitiation | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (!Number.isInteger(listingId) || listingId < 1) {
      setError('This listing link is invalid.');
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setError(null);
    setReportSuccess(false);
    setOrder(null);
    void getMarketplaceListing(listingId, controller.signal)
      .then(setProduct)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setProduct(null);
          setError(apiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [listingId, reloadKey]);

  async function toggleWishlist(listing: MarketplaceListing) {
    if (listing.ownListing || wishlistBusyIds.has(listing.id)) return;
    const wasWishlisted = listing.wishlisted;
    setError(null);
    setWishlistBusyIds((current) => new Set(current).add(listing.id));
    updateWishlistState(listing.id, !wasWishlisted);
    try {
      if (wasWishlisted) {
        await removeListingFromWishlist(listing.id);
      } else {
        await addListingToWishlist(listing.id);
      }
    } catch (requestError) {
      updateWishlistState(listing.id, wasWishlisted);
      setError(apiErrorMessage(requestError));
    } finally {
      setWishlistBusyIds((current) => {
        const next = new Set(current);
        next.delete(listing.id);
        return next;
      });
    }
  }

  function updateWishlistState(targetId: number, wishlisted: boolean) {
    setProduct((current) => {
      if (!current) return current;
      return {
        ...current,
        wishlisted: current.id === targetId ? wishlisted : current.wishlisted,
        similarListings: current.similarListings.map((listing) =>
          listing.id === targetId ? { ...listing, wishlisted } : listing,
        ),
      };
    });
  }

  async function submitReport(
    reason: ListingReportReason,
    description: string,
  ) {
    if (!product) return;
    try {
      await reportMarketplaceListing(product.id, reason, description);
      setReportSuccess(true);
    } catch (requestError) {
      throw new Error(apiErrorMessage(requestError));
    }
  }

  async function createOrder() {
    if (!product || buyBusy) return;
    setBuyBusy(true);
    setBuyError(null);
    try {
      setOrder(await initiateMarketplaceOrder(product.id));
    } catch (requestError) {
      setBuyError(apiErrorMessage(requestError));
    } finally {
      setBuyBusy(false);
    }
  }

  function closeBuyDialog() {
    if (buyBusy) return;
    setBuyOpen(false);
    setBuyError(null);
  }

  if (loading) return <ProductDetailsSkeleton />;

  if (!product) {
    return (
      <ProductUnavailableState
        message={
          error ??
          'This item may have been sold, removed, or listed at another college.'
        }
        onRetry={() => setReloadKey((current) => current + 1)}
      />
    );
  }

  const active = product.status === 'ACTIVE';

  return (
    <div className="pb-10">
      <nav
        aria-label="Product breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-2 text-sm"
      >
        <Link
          className="inline-flex items-center gap-2 font-bold text-[#007b95] hover:text-[#005d72]"
          to="/student/marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          My College Marketplace
        </Link>
        <span aria-hidden="true" className="text-[#a0a9b6]">
          /
        </span>
        <Link
          className="font-semibold text-[#526176] hover:text-[#007b95]"
          to={`/student/marketplace?search=${encodeURIComponent(product.category)}`}
        >
          {product.category}
        </Link>
        <span aria-hidden="true" className="text-[#a0a9b6]">
          /
        </span>
        <span className="max-w-[320px] truncate text-[#667386]">
          {product.title}
        </span>
      </nav>

      {error && (
        <MessageBanner
          message={error}
          onDismiss={() => setError(null)}
          tone="error"
        />
      )}
      {reportSuccess && (
        <MessageBanner
          message="Report submitted. Campus Hub administrators can now review this listing."
          onDismiss={() => setReportSuccess(false)}
          tone="success"
        />
      )}
      {!active && (
        <div
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          role="status"
        >
          This item has already been sold. Buying, wishlist changes, and
          reporting are unavailable.
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
        <div className="space-y-6">
          <ProductImageGallery product={product} />

          <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] sm:p-6">
            <h2 className="text-lg font-black text-[#10233d]">
              Product description
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#5b697b]">
              {product.description}
            </p>
            {product.additionalNotes && (
              <div className="mt-5 rounded-xl border border-[#dbe4f0] bg-[#f8faff] px-4 py-3">
                <h3 className="text-xs font-black uppercase tracking-[0.1em] text-[#40546d]">
                  Additional notes
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#5b697b]">
                  {product.additionalNotes}
                </p>
              </div>
            )}
            <div
              aria-label="Listing assurances"
              className="mt-5 flex flex-wrap gap-2"
            >
              <ListingAssurance
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="Verified college listing"
              />
              <ListingAssurance
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Campus pickup"
              />
              <ListingAssurance
                icon={<Tag className="h-3.5 w-3.5" />}
                label={product.negotiable ? 'Negotiable price' : 'Fixed price'}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
            <h2 className="flex items-center gap-2 font-black text-emerald-950">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              Safe campus handover
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-900">
              <li>Meet in a public, well-lit campus area.</li>
              <li>Inspect the item before confirming handover.</li>
              <li>Keep payment and order confirmation inside Campus Hub.</li>
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.06)] sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#007b95]">
                <Tag aria-hidden="true" className="h-3.5 w-3.5" />
                {product.category}
              </span>
              <span className="rounded-full bg-[#eff4ff] px-2.5 py-1 text-[11px] font-bold text-[#344861]">
                {conditionLabel(product.condition)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {active ? 'Available' : 'Sold'}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <h1 className="text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
                {product.title}
              </h1>
              <div className="sm:text-right">
                <strong className="block text-3xl font-black tracking-[-0.03em] text-[#031635]">
                  {formatPrice(product.price)}
                </strong>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                    product.negotiable
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {product.negotiable ? 'Negotiable' : 'Fixed price'}
                </span>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <ProductFact
                icon={<MapPin className="h-4 w-4" />}
                label="Pickup"
                value={product.pickupLocation}
              />
              <ProductFact
                icon={<PackageCheck className="h-4 w-4" />}
                label="Quantity"
                value={`${product.availableQuantity} available`}
              />
              <ProductFact
                icon={<CalendarDays className="h-4 w-4" />}
                label="Posted"
                value={relativeTime(product.createdAt)}
              />
              <ProductFact
                icon={<ShieldCheck className="h-4 w-4" />}
                label="College"
                value={product.college.name}
              />
            </dl>

            {product.ownListing ? (
              <Link
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#031635] px-5 text-sm font-bold text-white hover:bg-[#153557]"
                to="/student/my-marketplace"
              >
                Manage your listing
              </Link>
            ) : active ? (
              <div className="mt-6 space-y-3">
                <button
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#031635] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#153557]"
                  onClick={() => setBuyOpen(true)}
                  type="button"
                >
                  <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                  Buy now
                </button>
                <button
                  aria-pressed={product.wishlisted}
                  className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold ${
                    product.wishlisted
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-[#bac5d3] text-[#263a52] hover:border-rose-200 hover:text-rose-700'
                  } disabled:cursor-wait disabled:opacity-60`}
                  disabled={wishlistBusyIds.has(product.id)}
                  onClick={() => toggleWishlist(product)}
                  type="button"
                >
                  <Heart
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill={product.wishlisted ? 'currentColor' : 'none'}
                  />
                  {product.wishlisted ? 'Wishlisted' : 'Add to wishlist'}
                </button>
                {product.canReport && (
                  <button
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-[#687587] hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setReportOpen(true)}
                    type="button"
                  >
                    <Flag aria-hidden="true" className="h-4 w-4" />
                    Report listing
                  </button>
                )}
              </div>
            ) : (
              <button
                className="mt-6 h-12 w-full cursor-not-allowed rounded-xl bg-[#d9dee7] text-sm font-bold text-[#778395]"
                disabled
                type="button"
              >
                Item unavailable
              </button>
            )}
          </section>

          <SellerInfoCard seller={product.seller} />
        </div>
      </div>

      <SimilarListings
        category={product.category}
        collegeName={product.college.name}
        listings={product.similarListings}
        onWishlistChange={toggleWishlist}
        wishlistBusyIds={wishlistBusyIds}
      />

      <ReportListingModal
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
        open={reportOpen}
        productTitle={product.title}
      />
      <BuyNowModal
        error={buyError}
        onClose={closeBuyDialog}
        onConfirm={createOrder}
        open={buyOpen}
        order={order}
        product={product}
        submitting={buyBusy}
      />
    </div>
  );
}

function ListingAssurance({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe4f0] bg-[#f3f7fd] px-3 py-2 text-xs font-bold text-[#40546d]">
      {icon}
      {label}
    </span>
  );
}

function ProductFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f6f8fc] p-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#788496]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 line-clamp-2 text-sm font-bold text-[#25384f]">
        {value}
      </dd>
    </div>
  );
}

function MessageBanner({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: 'error' | 'success';
  onDismiss: () => void;
}) {
  return (
    <div
      className={`mb-5 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-medium ${
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      }`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span>{message}</span>
      <button
        className="shrink-0 text-xs font-bold underline underline-offset-2"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div
      aria-label="Loading product details"
      className="grid animate-pulse gap-6 xl:grid-cols-[1.08fr_0.92fr]"
      role="status"
    >
      <div className="space-y-5">
        <div className="aspect-[4/3] rounded-2xl bg-[#e7edf5]" />
        <div className="h-36 rounded-2xl bg-white" />
      </div>
      <div className="space-y-5">
        <div className="h-[500px] rounded-2xl bg-white p-7">
          <div className="h-3 w-32 rounded bg-[#e7edf5]" />
          <div className="mt-5 h-8 w-4/5 rounded bg-[#e7edf5]" />
          <div className="mt-7 h-10 w-36 rounded bg-[#e7edf5]" />
          <div className="mt-7 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div className="h-20 rounded-xl bg-[#eef2f7]" key={item} />
            ))}
          </div>
        </div>
        <div className="h-72 rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function ProductUnavailableState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <RefreshCw aria-hidden="true" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-black text-[#071b33]">
        Listing unavailable
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#667386]">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          className="rounded-xl border border-[#b8c1ce] px-5 py-3 text-sm font-bold text-[#10233d]"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
        <Link
          className="rounded-xl bg-[#031635] px-5 py-3 text-sm font-bold text-white"
          to="/student/marketplace"
        >
          Browse marketplace
        </Link>
      </div>
    </div>
  );
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'The listing service is unavailable. Please try again.'
    );
  }
  return 'The listing service is unavailable. Please try again.';
}
