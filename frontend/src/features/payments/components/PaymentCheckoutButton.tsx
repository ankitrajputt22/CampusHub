import { isAxiosError } from 'axios';
import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useStudentDashboard } from '../../student/dashboard/context/studentDashboardContext';
import {
  recordRazorpayFailure,
  retryPaymentCheckout,
  verifyRazorpayPayment,
} from '../api/paymentsApi';
import { openRazorpayCheckout } from '../lib/razorpayCheckout';

export function PaymentCheckoutButton({
  orderId,
  className,
  label = 'Pay now',
  onStatus,
}: {
  orderId: number;
  className?: string;
  label?: string;
  onStatus?: (message: string, tone: 'success' | 'error' | 'info') => void;
}) {
  const navigate = useNavigate();
  const { refresh } = useStudentDashboard();
  const [phase, setPhase] = useState<
    'idle' | 'creating' | 'opening' | 'verifying'
  >('idle');

  async function pay() {
    if (phase !== 'idle') return;
    try {
      setPhase('creating');
      onStatus?.('Creating a secure Razorpay order...', 'info');
      const checkout = await retryPaymentCheckout(orderId);
      setPhase('opening');
      onStatus?.('Opening Razorpay Checkout...', 'info');
      const outcome = await openRazorpayCheckout(checkout);
      if (outcome.type === 'dismissed') {
        onStatus?.(
          'Payment was not completed. You can safely try again.',
          'info',
        );
        return;
      }
      if (outcome.type === 'failed') {
        await recordRazorpayFailure(checkout, outcome.response);
        onStatus?.('Payment failed. Please try again.', 'error');
        void refresh();
        return;
      }
      setPhase('verifying');
      onStatus?.('Verifying payment securely...', 'info');
      await verifyRazorpayPayment(checkout, outcome.response);
      await refresh();
      onStatus?.('Payment verified successfully.', 'success');
      navigate(`/student/orders/${checkout.order.id}`, {
        state: { paymentVerified: true },
      });
    } catch (error) {
      onStatus?.(paymentErrorMessage(error), 'error');
    } finally {
      setPhase('idle');
    }
  }

  const busyLabel = {
    idle: label,
    creating: 'Creating payment...',
    opening: 'Opening checkout...',
    verifying: 'Verifying payment...',
  }[phase];

  return (
    <button
      className={
        className ??
        'inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#071b33] px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60'
      }
      disabled={phase !== 'idle'}
      onClick={pay}
      type="button"
    >
      <CreditCard aria-hidden="true" className="h-4 w-4" />
      {busyLabel}
    </button>
  );
}

function paymentErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'Payment could not be started. Please try again.'
    );
  }
  return error instanceof Error
    ? error.message
    : 'Payment could not be started. Please try again.';
}
