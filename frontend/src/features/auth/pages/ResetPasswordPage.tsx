import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { completePasswordReset, getApiErrorMessage } from '../api/authApi';
import {
  AuthUtilityLayout,
  utilityInputClass,
} from '../components/AuthUtilityLayout';
import {
  clearPasswordRecovery,
  getPasswordRecovery,
} from '../lib/passwordRecovery';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must not exceed 72 characters.')
      .regex(/[a-z]/, 'Add at least one lowercase letter.')
      .regex(/[A-Z]/, 'Add at least one uppercase letter.')
      .regex(/\d/, 'Add at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Add at least one special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const recovery = getPasswordRecovery();
  const [updated, setUpdated] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  if (!recovery?.resetToken && !updated) {
    return (
      <AuthUtilityLayout
        description="Verify a current recovery code before choosing a new password."
        eyebrow="Account recovery"
        title="Recovery session required"
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

  async function submit(values: FormValues) {
    if (!recovery?.resetToken) return;
    setServerError('');
    try {
      await completePasswordReset({
        requestId: recovery.requestId,
        resetToken: recovery.resetToken,
        ...values,
      });
      clearPasswordRecovery();
      setUpdated(true);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

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
            Password updated successfully
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Existing sessions were revoked. Sign in again with your new
            password.
          </p>
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
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <PasswordField
            error={errors.newPassword?.message}
            label="New password"
            registration={register('newPassword')}
          />
          <PasswordField
            error={errors.confirmPassword?.message}
            label="Confirm password"
            registration={register('confirmPassword')}
          />
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
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            )}
            {isSubmitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthUtilityLayout>
  );
}

function PasswordField({
  label,
  error,
  registration,
}: {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      <input
        autoComplete="new-password"
        className={utilityInputClass}
        type="password"
        {...registration}
      />
      {error && (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
