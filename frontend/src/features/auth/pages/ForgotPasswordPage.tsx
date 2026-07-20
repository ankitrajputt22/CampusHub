import { Check, Mail } from 'lucide-react';
import { useState } from 'react';

import {
  AuthUtilityLayout,
  utilityInputClass,
} from '../components/AuthUtilityLayout';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthUtilityLayout
      description="Enter your verified college email. The production flow will send a short-lived recovery code."
      eyebrow="Account recovery"
      title="Forgot your password?"
    >
      {sent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          <Check aria-hidden="true" className="mr-2 inline h-4 w-4" />
          Test recovery request accepted. Continue to OTP verification to
          preview the next step.
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              College email
            </span>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${utilityInputClass} pl-10`}
                placeholder="student@college.ac.in"
                required
                type="email"
              />
            </div>
          </label>
          <button
            className="h-11 w-full rounded-lg bg-[#071b33] text-sm font-semibold text-white"
            type="submit"
          >
            Send test recovery code
          </button>
        </form>
      )}
    </AuthUtilityLayout>
  );
}
