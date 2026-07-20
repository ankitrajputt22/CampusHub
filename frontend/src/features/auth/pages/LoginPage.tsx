import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { z } from 'zod';

import { getApiErrorMessage, login } from '../api/authApi';
import { AuthShowcase } from '../components/AuthShowcase';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'College email is required.')
    .email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const passwordField = register('password');

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

  async function onSubmit(values: LoginFormValues) {
    setServerMessage('');
    try {
      const response = await login(values);
      window.localStorage.setItem(
        'campusHub.auth.accessToken',
        response.accessToken,
      );
      window.localStorage.setItem(
        'campusHub.auth.refreshToken',
        response.refreshToken,
      );
      window.localStorage.setItem(
        'campusHub.auth.user',
        JSON.stringify(response.user),
      );

      const redirectFromState =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : null;
      const redirectTo =
        searchParams.get('redirectTo') ??
        redirectFromState ??
        roleRedirectPath(response.user.role);

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerMessage(getApiErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthShowcase
          copy="Buy, sell, wishlist, review, and manage your campus deals securely within your academic community."
          foot="Verified access. Safer campus trades."
          title="Login to your verified college marketplace."
        />

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#031635] text-xs font-bold text-white">
                CH
              </span>
              <span className="text-xl font-bold text-[#031635]">
                Campus Hub
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-[0_4px_12px_rgba(3,22,53,0.05)] sm:p-10">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#031635]">
                  Welcome back
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Login to continue to your college marketplace.
                </p>
              </div>

              {serverMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {serverMessage}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-900"
                    htmlFor="email"
                  >
                    College Email
                  </label>
                  <input
                    className={inputClass(Boolean(errors.email))}
                    id="email"
                    placeholder="Enter your college email"
                    type="email"
                    {...register('email')}
                  />
                  <ErrorText message={errors.email?.message} />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-900"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className={`${inputClass(Boolean(errors.password))} pr-16`}
                      id="password"
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      {...passwordField}
                      onBlur={(event) => {
                        passwordField.onBlur(event);
                        setCapsLockOn(false);
                      }}
                      onKeyDown={handlePasswordKey}
                      onKeyUp={handlePasswordKey}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {capsLockOn && (
                    <p className="text-sm text-amber-700">Caps Lock is on.</p>
                  )}
                  <ErrorText message={errors.password?.message} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      className="h-4 w-4 rounded border-slate-300 text-[#031635] focus:ring-[#00677f]"
                      type="checkbox"
                      {...register('rememberMe')}
                    />
                    Remember Me
                  </label>
                  <Link
                    className="text-sm font-semibold text-[#031635] hover:text-[#00677f]"
                    to="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  className="flex w-full items-center justify-center rounded-lg bg-[#031635] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#213145] disabled:bg-slate-400"
                  disabled={!isValid || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                By logging in, you agree to our{' '}
                <Link
                  className="font-semibold text-[#031635]"
                  to="/terms-and-conditions"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  className="font-semibold text-[#031635]"
                  to="/privacy-policy"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <p className="mt-8 text-center text-sm text-slate-600">
              New to Campus Hub?{' '}
              <Link
                className="font-semibold text-[#031635] hover:text-[#00677f]"
                to="/signup"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function roleRedirectPath(role: string) {
  if (role === 'ADMIN') {
    return '/admin/dashboard';
  }
  if (role === 'SUPER_ADMIN') {
    return '/super-admin/dashboard';
  }
  return '/student/dashboard';
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-[#00677f] focus:ring-cyan-100'
  }`;
}

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}
