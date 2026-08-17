import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  Check,
  CircleUserRound,
  MapPin,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import { PaymentCheckoutButton } from '../../payments/components/PaymentCheckoutButton';
import { useStudentDashboard } from '../../student/dashboard/context/studentDashboardContext';
import { createOrderConversation } from '../../chat/api/chatApi';
import {
  cancelOrder,
  confirmOrderPickup,
  getOrderDetails,
  markOrderReady,
  type OrderAction,
  type OrderDetails,
} from '../api/ordersApi';
import {
  ConfirmActionModal,
  OrderStatusBadge,
  PaymentStatusBadge,
  ProductThumb,
} from '../components/OrderUi';
import { formatCurrency, formatDate, humanize } from '../lib/orderFormat';

type MutableAction =
  'CANCEL_ORDER' | 'CONFIRM_PICKUP' | 'MARK_READY_FOR_PICKUP';

export function OrderDetailsPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const id = Number(orderId);
  const { refresh: refreshDashboard } = useStudentDashboard();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    isVerifiedPaymentNavigation(location.state)
      ? 'Payment successful. Your order is confirmed.'
      : null,
  );
  const [action, setAction] = useState<MutableAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  const loadOrder = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(id) || id < 1) {
        setError('This order link is invalid.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        setOrder(await getOrderDetails(id, signal));
      } catch (requestError) {
        if (
          isAxiosError(requestError) &&
          requestError.code === 'ERR_CANCELED'
        ) {
          return;
        }
        setError(apiErrorMessage(requestError));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadOrder(controller.signal);
    return () => controller.abort();
  }, [loadOrder]);

  async function confirmAction() {
    if (!action || !order) return;
    setActionBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result =
        action === 'CANCEL_ORDER'
          ? await cancelOrder(order.id)
          : action === 'MARK_READY_FOR_PICKUP'
            ? await markOrderReady(order.id)
            : await confirmOrderPickup(order.id);
      setAction(null);
      setSuccess(result.message);
      await loadOrder();
      void refreshDashboard();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, true));
    } finally {
      setActionBusy(false);
    }
  }

  async function openOrderChat() {
    if (!order || chatBusy) return;
    setChatBusy(true);
    setError(null);
    try {
      const result = await createOrderConversation(order.id);
      navigate(`/student/chats/${result.conversation.id}`);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, true));
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5" role="status">
        <span className="sr-only">Loading order details</span>
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center">
        <h1 className="text-xl font-black text-[#071b33]">
          Order could not be loaded
        </h1>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            className="inline-flex h-10 items-center rounded-xl border border-[#cfd8e5] px-4 text-sm font-black text-[#344960]"
            to="/student/orders"
          >
            Back to orders
          </Link>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#071b33] px-4 text-sm font-black text-white"
            onClick={() => void loadOrder()}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!order) return null;
  const imageUrl = resolveApiAssetUrl(order.listing.coverImageUrl);

  return (
    <div className="space-y-6 pb-10">
      <header className="border-b border-[#dce2eb] pb-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-black text-[#4c6077] hover:text-[#007b95]"
          to="/student/orders"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to orders
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#007b95]">
              {order.role === 'BUYER' ? 'Purchase details' : 'Sale details'}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
              {order.orderNumber}
            </h1>
            <p className="mt-2 text-sm text-[#69778a]">
              Created {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
      </header>

      {success && (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
          role="status"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {success}
        </div>
      )}
      {error && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProductThumb imageUrl={imageUrl} title={order.listing.title} />
          <div className="min-w-0 flex-1">
            <Link
              className="text-xl font-black text-[#071b33] hover:text-[#007b95]"
              to={`/listing/${order.listing.id}`}
            >
              {order.listing.title}
            </Link>
            <p className="mt-2 text-sm font-bold text-[#69778a]">
              {humanize(order.listing.category)} ·{' '}
              {humanize(order.listing.condition)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#788496]">
              Order total
            </p>
            <p className="mt-1 text-2xl font-black text-[#071b33]">
              {formatCurrency(order.amount)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black text-[#071b33]">Order timeline</h2>
          <p className="mt-1 text-sm text-[#69778a]">
            A server-recorded history of this transaction.
          </p>
          <ol className="mt-6 space-y-0">
            {order.timeline.map((entry, index) => (
              <li
                className="relative grid grid-cols-[28px_1fr] gap-3 pb-7 last:pb-0"
                key={`${entry.status}-${entry.createdAt}`}
              >
                {index < order.timeline.length - 1 && (
                  <span className="absolute bottom-0 left-[13px] top-7 w-px bg-[#cfd9e5]" />
                )}
                <span className="z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#dff6fa] text-[#007b95]">
                  <Check aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-black text-[#203650]">
                    {humanize(entry.status)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#687587]">
                    {entry.note}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#8792a1]">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-5">
          <InfoCard
            icon={CircleUserRound}
            label={order.role === 'BUYER' ? 'Seller' : 'Buyer'}
            title={order.otherParty.fullName}
          >
            <p>
              {order.otherParty.trustScore}/100 · {order.otherParty.trustLevel}
            </p>
            <p className="mt-3 rounded-xl bg-[#f3f6fa] p-3 text-xs leading-5 text-[#667386]">
              Private email and phone details are not exposed in order records.
            </p>
          </InfoCard>

          <InfoCard
            icon={MapPin}
            label="Pickup location"
            title={order.pickupLocation}
          >
            Meet in a public campus location and inspect the item before
            confirming handover.
          </InfoCard>

          <InfoCard
            icon={ShieldCheck}
            label="Payment"
            title={`Payment ${humanize(order.paymentStatus)}`}
          >
            {order.paidAt
              ? `Verified on ${formatDate(order.paidAt)}`
              : 'Payment verification has not been completed.'}
          </InfoCard>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#cdd8e5] bg-[#f7f9fc] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black text-[#071b33]">Available actions</h2>
          <p className="mt-1 text-sm text-[#69778a]">
            Actions are limited by your role and the verified order state.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#071b33] px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
            disabled={chatBusy}
            onClick={() => void openOrderChat()}
            type="button"
          >
            {chatBusy ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {chatBusy
              ? 'Opening chat…'
              : `Message ${order.role === 'BUYER' ? 'seller' : 'buyer'}`}
          </button>
          {order.availableActions.includes('PAY_NOW') && (
            <PaymentCheckoutButton
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#071b33] px-4 text-sm font-black text-white"
              onStatus={(message, tone) => {
                setError(tone === 'error' ? message : null);
                setSuccess(tone === 'error' ? null : message);
                if (tone !== 'info') void loadOrder();
              }}
              orderId={order.id}
            />
          )}
          <DetailActionButton
            action="CANCEL_ORDER"
            availableActions={order.availableActions}
            label="Cancel order"
            onClick={setAction}
            tone="danger"
          />
          <DetailActionButton
            action="MARK_READY_FOR_PICKUP"
            availableActions={order.availableActions}
            label="Mark ready for pickup"
            onClick={setAction}
          />
          <DetailActionButton
            action="CONFIRM_PICKUP"
            availableActions={order.availableActions}
            label="Confirm pickup"
            onClick={setAction}
          />
          {order.availableActions.includes('WRITE_REVIEW') && (
            <Link
              className="inline-flex h-10 items-center rounded-xl bg-[#071b33] px-4 text-sm font-black text-white"
              to={`/student/reviews?orderId=${order.id}`}
            >
              Write review
            </Link>
          )}
          {order.availableActions.length === 1 && (
            <span className="inline-flex h-10 items-center rounded-xl border border-[#cfd8e5] bg-white px-4 text-sm font-bold text-[#69778a]">
              No action required
            </span>
          )}
        </div>
      </section>

      <p className="rounded-xl border border-[#dce2eb] bg-white px-4 py-3 text-sm leading-6 text-[#69778a]">
        Payment failures, duplicate charges, eligible cancellations, and refund
        requests are handled according to the{' '}
        <Link className="font-black text-[#007b95]" to="/refund-policy">
          Campus Hub Refund Policy
        </Link>
        . If you need help, create a{' '}
        <Link className="font-black text-[#007b95]" to="/student/support/new">
          support ticket
        </Link>
        . Review the{' '}
        <Link className="font-black text-[#007b95]" to="/safety-guidelines">
          Safety Guidelines
        </Link>{' '}
        before arranging pickup.
      </p>

      {action && (
        <ConfirmActionModal
          busy={actionBusy}
          confirmLabel={actionLabel(action)}
          danger={action === 'CANCEL_ORDER'}
          description={
            action === 'CONFIRM_PICKUP'
              ? 'Confirm only after you have inspected and received the item. This action completes the order.'
              : action === 'MARK_READY_FOR_PICKUP'
                ? 'The buyer will be notified that the item is ready at the campus pickup location.'
                : 'This pending order will be cancelled. This does not process a refund because payment has not succeeded.'
          }
          onCancel={() => {
            if (!actionBusy) setAction(null);
          }}
          onConfirm={confirmAction}
          title={actionLabel(action)}
        />
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  title,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7fa] text-[#007b95]">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#788496]">
            {label}
          </p>
          <h2 className="mt-1 font-black text-[#10233d]">{title}</h2>
          <div className="mt-2 text-sm leading-6 text-[#687587]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailActionButton({
  action,
  availableActions,
  label,
  onClick,
  tone = 'primary',
}: {
  action: MutableAction;
  availableActions: OrderAction[];
  label: string;
  onClick: (action: MutableAction) => void;
  tone?: 'primary' | 'danger';
}) {
  if (!availableActions.includes(action)) return null;
  return (
    <button
      className={`h-10 rounded-xl px-4 text-sm font-black ${
        tone === 'danger'
          ? 'border border-rose-200 bg-white text-rose-700'
          : 'bg-[#071b33] text-white'
      }`}
      onClick={() => onClick(action)}
      type="button"
    >
      {label}
    </button>
  );
}

function actionLabel(action: MutableAction) {
  if (action === 'CANCEL_ORDER') return 'Cancel order';
  if (action === 'MARK_READY_FOR_PICKUP') return 'Mark ready for pickup';
  return 'Confirm pickup';
}

function apiErrorMessage(error: unknown, action = false) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      (action
        ? 'The order could not be updated. Please try again.'
        : 'This order could not be loaded.')
    );
  }
  return action
    ? 'The order could not be updated. Please try again.'
    : 'This order could not be loaded.';
}

function isVerifiedPaymentNavigation(state: unknown) {
  return (
    typeof state === 'object' &&
    state !== null &&
    'paymentVerified' in state &&
    state.paymentVerified === true
  );
}
