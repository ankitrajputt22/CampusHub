import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { getApiErrorMessage, requestPasswordReset } from '../api/authApi';
import {
  AuthUtilityLayout,
  utilityInputClass,
} from '../components/AuthUtilityLayout';
import { savePasswordRecovery } from '../lib/passwordRecovery';

const schema = z.object({
  email: z
    .string()
    .min(1, 'College email is required.')
    .email('Please enter a valid email address.'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function submit(values: FormValues) {
    setServerError('');
    try {
      const response = await requestPasswordReset(values.email);
      savePasswordRecovery({
        requestId: response.requestId,
        email: values.email.trim().toLowerCase(),
      });
      navigate('/verify-otp', {
        state: { devOtp: response.devOtp },
      });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <AuthUtilityLayout
      description="Enter your verified college email. If the account is eligible, Campus Hub will issue a short-lived recovery code."
      eyebrow="Account recovery"
      title="Forgot your password?"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(submit)(event)}
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
              autoComplete="email"
              className={`${utilityInputClass} pl-10`}
              placeholder="student@college.ac.in"
              type="email"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <span className="mt-1.5 block text-xs text-red-600">
              {errors.email.message}
            </span>
          )}
        </label>
        {serverError && (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {serverError}
          </p>
        )}
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#071b33] text-sm font-semibold text-white disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          )}
          {isSubmitting ? 'Requesting code…' : 'Send recovery code'}
        </button>
      </form>
    </AuthUtilityLayout>
  );
}
