import { Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthUtilityLayout } from '../components/AuthUtilityLayout';

export function OtpVerificationPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  function updateCode(index: number, value: string) {
    const next = [...code];
    next[index] = value.replace(/\D/g, '').slice(-1);
    setCode(next);
  }
  return (
    <AuthUtilityLayout
      description="Enter the six-digit code associated with your recovery or account verification request."
      eyebrow="Identity check"
      title="Verify OTP"
    >
      {verified ? (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check aria-hidden="true" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-bold text-slate-950">
            Code accepted for testing
          </h2>
          <button
            className="mt-5 h-10 rounded-lg bg-[#071b33] px-5 text-sm font-semibold text-white"
            onClick={() => navigate('/reset-password')}
            type="button"
          >
            Continue to reset password
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-6 gap-2">
            {code.map((digit, index) => (
              <input
                aria-label={`OTP digit ${index + 1}`}
                className="h-12 min-w-0 rounded-lg border border-slate-300 text-center text-lg font-bold outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                inputMode="numeric"
                key={index}
                onChange={(event) => updateCode(index, event.target.value)}
                value={digit}
              />
            ))}
          </div>
          <button
            className="mt-5 h-11 w-full rounded-lg bg-[#071b33] text-sm font-semibold text-white disabled:bg-slate-300"
            disabled={code.some((digit) => !digit)}
            onClick={() => setVerified(true)}
            type="button"
          >
            Verify test code
          </button>
          <button
            className="mt-4 w-full text-sm font-semibold text-cyan-800"
            type="button"
          >
            Resend code
          </button>
        </div>
      )}
    </AuthUtilityLayout>
  );
}
