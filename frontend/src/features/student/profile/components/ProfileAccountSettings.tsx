import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  KeyRound,
  LoaderCircle,
  LogOut,
  Power,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';

import { getApiErrorMessage } from '../../../auth/api/authApi';
import type { ChangePasswordPayload } from '../types';

type ModalKind = 'password' | 'logout-all' | 'deactivate' | null;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(72, 'New password must not exceed 72 characters.')
      .regex(/[a-z]/, 'Add at least one lowercase letter.')
      .regex(/[A-Z]/, 'Add at least one uppercase letter.')
      .regex(/\d/, 'Add at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Add at least one special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'New password and confirmation do not match.',
  });

export function ProfileAccountSettings({
  onChangePassword,
  onLogoutAll,
  onDeactivate,
}: {
  onChangePassword: (payload: ChangePasswordPayload) => Promise<void>;
  onLogoutAll: () => Promise<void>;
  onDeactivate: () => Promise<void>;
}) {
  const [modal, setModal] = useState<ModalKind>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setModal(null);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <section
      className="scroll-mt-28 rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)] sm:p-6"
      id="profile-security"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1f7] text-[#364768]">
          <ShieldAlert aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-[#031635]">
            Account settings
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#68707d]">
            Security actions require confirmation and are handled by the
            backend.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <AccountAction
          description="Verify your current password before setting a new one."
          icon={KeyRound}
          label="Change password"
          onClick={() => setModal('password')}
        />
        <AccountAction
          description="Revoke every active refresh token, including this one."
          icon={LogOut}
          label="Logout all devices"
          onClick={() => setModal('logout-all')}
        />
        <AccountAction
          danger
          description="Submit a reviewable request without deleting order history."
          icon={Power}
          label="Deactivate account"
          onClick={() => setModal('deactivate')}
        />
      </div>

      {modal === 'password' && (
        <ChangePasswordModal
          close={() => setModal(null)}
          submit={onChangePassword}
        />
      )}
      {modal === 'logout-all' && (
        <ConfirmationModal
          actionLabel="Logout all devices"
          close={() => setModal(null)}
          description="Every Campus Hub session for your account will be revoked. You will need to sign in again on each device."
          icon={LogOut}
          submit={onLogoutAll}
          title="Logout from all devices?"
        />
      )}
      {modal === 'deactivate' && (
        <ConfirmationModal
          actionLabel="Submit deactivation request"
          close={() => setModal(null)}
          danger
          description="Your account will be marked DEACTIVATION_REQUESTED. We will retain order, payment, and review records required for marketplace safety."
          icon={AlertTriangle}
          submit={onDeactivate}
          title="Request account deactivation?"
        />
      )}
    </section>
  );
}

function AccountAction({
  label,
  description,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  description: string;
  icon: typeof KeyRound;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`rounded-xl border p-4 text-left transition ${
        danger
          ? 'border-red-200 bg-red-50 hover:border-red-300'
          : 'border-[#e0e4ec] bg-[#f8f9ff] hover:border-[#8293b8]'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={`h-5 w-5 ${danger ? 'text-red-700' : 'text-[#364768]'}`}
      />
      <span
        className={`mt-3 block text-sm font-bold ${
          danger ? 'text-red-900' : 'text-[#263346]'
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-1 block text-xs leading-5 ${
          danger ? 'text-red-700' : 'text-[#68707d]'
        }`}
      >
        {description}
      </span>
    </button>
  );
}

function ChangePasswordModal({
  close,
  submit,
}: {
  close: () => void;
  submit: (payload: ChangePasswordPayload) => Promise<void>;
}) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordPayload>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function change(values: ChangePasswordPayload) {
    setServerError('');
    try {
      await submit(values);
      close();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <Modal close={close} title="Change password">
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(change)(event)}
      >
        <PasswordField
          error={errors.currentPassword?.message}
          label="Current password"
          register={register('currentPassword')}
        />
        <PasswordField
          error={errors.newPassword?.message}
          label="New password"
          register={register('newPassword')}
        />
        <PasswordField
          error={errors.confirmPassword?.message}
          label="Confirm new password"
          register={register('confirmPassword')}
        />
        <p className="rounded-lg bg-[#eff4ff] px-3 py-2 text-xs leading-5 text-[#536079]">
          Use at least 8 characters with uppercase, lowercase, number, and
          special character.
        </p>
        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <ModalCancel close={close} />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#031635] px-5 text-sm font-bold text-white disabled:opacity-60"
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
        </div>
      </form>
    </Modal>
  );
}

function ConfirmationModal({
  title,
  description,
  actionLabel,
  icon: Icon,
  close,
  submit,
  danger = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  icon: typeof LogOut;
  close: () => void;
  submit: () => Promise<void>;
  danger?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setSubmitting(true);
    setError('');
    try {
      await submit();
      close();
    } catch (caught) {
      setError(getApiErrorMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <Modal close={close} title={title}>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          danger ? 'bg-red-100 text-red-700' : 'bg-[#e5eeff] text-[#364768]'
        }`}
      >
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#536079]">{description}</p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ModalCancel close={close} />
        <button
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white disabled:opacity-60 ${
            danger ? 'bg-red-700 hover:bg-red-800' : 'bg-[#031635]'
          }`}
          disabled={submitting}
          onClick={() => void confirm()}
          type="button"
        >
          {submitting && (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          )}
          {submitting ? 'Please wait…' : actionLabel}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#031635]/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-[#031635]">
            {title}
          </h2>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-2 text-[#68707d] hover:bg-[#eff4ff]"
            onClick={close}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  error,
  register,
}: {
  label: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#263346]">
        {label}
      </span>
      <input
        autoComplete={
          label === 'Current password' ? 'current-password' : 'new-password'
        }
        className="h-11 w-full rounded-lg border border-[#c5c6cf] px-3 text-sm outline-none focus:border-[#00677f] focus:ring-2 focus:ring-cyan-100"
        type="password"
        {...register}
      />
      {error && (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function ModalCancel({ close }: { close: () => void }) {
  return (
    <button
      className="h-11 rounded-lg border border-[#c5c6cf] px-5 text-sm font-bold text-[#263346] hover:bg-[#f8f9ff]"
      onClick={close}
      type="button"
    >
      Cancel
    </button>
  );
}
