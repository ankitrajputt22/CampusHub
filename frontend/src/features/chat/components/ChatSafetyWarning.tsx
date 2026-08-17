import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ChatSafetyWarning() {
  return (
    <aside className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
      <div className="flex gap-2.5">
        <ShieldAlert
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
        />
        <p>
          <strong>Protect your account.</strong> Campus Hub will never ask for
          your password, OTP, card details, CVV, or UPI PIN. A payment
          screenshot is not proof of payment. Meet only in a public campus
          location and never share a room number.{' '}
          <Link
            className="font-black underline underline-offset-2"
            to="/safety-guidelines"
          >
            Safety Guidelines
          </Link>
        </p>
      </div>
    </aside>
  );
}
