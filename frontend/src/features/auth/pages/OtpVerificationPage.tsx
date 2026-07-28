import { Check, LoaderCircle, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  getApiErrorMessage,
  requestPasswordReset,
  verifyPasswordReset,
} from '../api/authApi';
import { AuthUtilityLayout } from '../components/AuthUtilityLayout';
import {
  getPasswordRecovery,
  savePasswordRecovery,
} from '../lib/passwordRecovery';

export function OtpVerificationPage() {
  const recovery = getPasswordRecovery();
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(() => {
    if (
      typeof location.state === 'object' &&
      location.state !== null &&
      'devOtp' in location.state &&
      typeof location.state.devOtp === 'string'
    ) {
      return location.state.devOtp;
    }
    return null;
  });
  const maskedEmail = useMemo(
    () => (recovery ? maskEmail(recovery.email) : ''),
    [recovery],
  );

  if (!recovery) {
    return (
      <AuthUtilityLayout
        description="This recovery session is missing or has expired."
        eyebrow="Identity check"
        title="Request a new code"
      >
        <Link
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#071b33] text-sm font-semibold text-white"
          to="/forgot-password"
        >
          Start password recovery
        </Link>
      </AuthUtilityLayout>
    );
  }

  const activeRecovery = recovery;

  async function verify() {
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await verifyPasswordReset(
        activeRecovery.requestId,
        code,
      );
      savePasswordRecovery({
        ...activeRecovery,
        requestId: response.requestId,
        resetToken: response.resetToken,
      });
      navigate('/reset-password', { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (resending) return;
    setResending(true);
    setError('');
    try {
      const response = await requestPasswordReset(activeRecovery.email);
      savePasswordRecovery({
        email: activeRecovery.email,
        requestId: response.requestId,
      });
      setDevOtp(response.devOtp);
      setCode('');
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthUtilityLayout
      description={`Enter the six-digit recovery code issued for ${maskedEmail}.`}
      eyebrow="Identity check"
      title="Verify recovery code"
    >
      {devOtp && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>Local development code:</strong>{' '}
          <span className="font-mono tracking-widest">{devOtp}</span>
        </div>
      )}
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-800">
          Recovery code
        </span>
        <input
          aria-label="Six-digit recovery code"
          autoComplete="one-time-code"
          autoFocus
          className="h-14 w-full rounded-lg border border-slate-300 text-center font-mono text-2xl font-black tracking-[0.45em] outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          inputMode="numeric"
          maxLength={6}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          value={code}
        />
      </label>
      {error && (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#071b33] text-sm font-semibold text-white disabled:bg-slate-300"
        disabled={code.length !== 6 || submitting}
        onClick={() => void verify()}
        type="button"
      >
        {submitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="h-4 w-4" />
        )}
        {submitting ? 'Verifying…' : 'Verify code'}
      </button>
      <button
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold text-cyan-800 disabled:opacity-50"
        disabled={resending}
        onClick={() => void resend()}
        type="button"
      >
        <RotateCcw
          aria-hidden="true"
          className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`}
        />
        {resending ? 'Requesting a new code…' : 'Resend code'}
      </button>
    </AuthUtilityLayout>
  );
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}
