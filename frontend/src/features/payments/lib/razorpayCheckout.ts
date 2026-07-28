import type {
  CheckoutOutcome,
  PaymentCheckout,
  RazorpayFailure,
  RazorpaySuccess,
} from '../api/paymentsApi';

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  confirm_close: boolean;
  retry: { enabled: boolean };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: 'payment.failed',
    callback: (response: RazorpayFailure) => void,
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let checkoutScript: Promise<void> | null = null;

export async function openRazorpayCheckout(
  checkout: PaymentCheckout,
): Promise<CheckoutOutcome> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error('Razorpay Checkout could not be loaded.');
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: CheckoutOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };
    const instance = new window.Razorpay!({
      key: checkout.razorpay.keyId,
      amount: checkout.razorpay.amount,
      currency: checkout.razorpay.currency,
      name: checkout.razorpay.name,
      description: checkout.razorpay.description,
      order_id: checkout.razorpay.razorpayOrderId,
      prefill: checkout.prefill,
      theme: { color: '#071b33' },
      confirm_close: true,
      retry: { enabled: true },
      handler: (response) => finish({ type: 'success', response }),
      modal: { ondismiss: () => finish({ type: 'dismissed' }) },
    });
    instance.on('payment.failed', (response) =>
      finish({ type: 'failed', response }),
    );
    instance.open();
  });
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  checkoutScript ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-campus-hub-razorpay]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Razorpay Checkout could not be loaded.')),
        { once: true },
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.campusHubRazorpay = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScript = null;
      reject(new Error('Razorpay Checkout could not be loaded.'));
    };
    document.head.appendChild(script);
  });
  return checkoutScript;
}
