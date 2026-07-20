import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AuthUtilityLayout,
  utilityInputClass,
} from '../components/AuthUtilityLayout';

export function ResetPasswordPage() {
  const [updated, setUpdated] = useState(false);
  return (
    <AuthUtilityLayout
      description="Choose a strong new password with uppercase, lowercase, number, and special characters."
      eyebrow="Account recovery"
      title="Reset password"
    >
      {updated ? (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check aria-hidden="true" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-bold text-slate-950">
            Test password updated
          </h2>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#071b33] px-5 text-sm font-semibold text-white"
            to="/login"
          >
            Return to login
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setUpdated(true);
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              New password
            </span>
            <input
              className={utilityInputClass}
              minLength={8}
              required
              type="password"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Confirm password
            </span>
            <input
              className={utilityInputClass}
              minLength={8}
              required
              type="password"
            />
          </label>
          <button
            className="h-11 w-full rounded-lg bg-[#071b33] text-sm font-semibold text-white"
            type="submit"
          >
            Update test password
          </button>
        </form>
      )}
    </AuthUtilityLayout>
  );
}
