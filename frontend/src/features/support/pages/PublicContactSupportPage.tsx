import {
  CheckCircle2,
  LifeBuoy,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { submitPublicSupport } from '../api/supportApi';
import type { SupportCategory } from '../api/supportApi';
import { SupportNotice } from '../components/SupportUi';
import { supportErrorMessage, validateSupportFiles } from '../lib/supportUtils';

const publicCategories: Array<{ value: SupportCategory; label: string }> = [
  { value: 'SIGNUP_LOGIN', label: 'Signup / Login Issue' },
  { value: 'OTP_VERIFICATION', label: 'OTP Not Received' },
  { value: 'ACCOUNT', label: 'Account Blocked or Account Access' },
  { value: 'TECHNICAL_BUG', label: 'Technical Problem' },
  { value: 'GENERAL', label: 'General Query' },
];

export function PublicContactSupportPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<SupportCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await submitPublicSupport(
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          category: category as SupportCategory,
          subject: subject.trim(),
          description: description.trim(),
        },
        files,
      );
      setTicketNumber(result.ticketNumber);
      setFullName('');
      setEmail('');
      setCategory('');
      setSubject('');
      setDescription('');
      setFiles([]);
    } catch (caught) {
      setError(
        supportErrorMessage(
          caught,
          'Unable to submit support request. Please try again.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function validate() {
    if (fullName.trim().length < 2) return 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return 'Enter a valid email address.';
    if (!category) return 'Please select an issue category.';
    if (subject.trim().length < 5)
      return 'Subject must be at least 5 characters.';
    if (description.trim().length < 20)
      return 'Description must be at least 20 characters.';
    return validateSupportFiles(files);
  }

  return (
    <div>
      <section className="border-b border-slate-200 bg-[#071b33] px-4 py-12 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-[#003846]">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            Contact Campus Hub Support
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Cannot log in or finish signup? Send a support request without an
            account. We’ll use your email only to follow up on this issue.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-black text-slate-950">
              <LockKeyhole className="h-5 w-5 text-cyan-700" />
              Already signed in?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the authenticated support workspace to track tickets, reply,
              and receive in-app notifications.
            </p>
            <Link
              className="mt-4 inline-flex rounded-xl bg-[#071b33] px-4 py-2.5 text-sm font-bold text-white"
              to="/student/support"
            >
              Open My Support Tickets
            </Link>
          </section>

          <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <h2 className="flex items-center gap-2 font-black text-cyan-950">
              <ShieldCheck className="h-5 w-5" /> Safe support
            </h2>
            <p className="mt-2 text-sm leading-6 text-cyan-900">
              Never include your password, OTP, UPI PIN, full card number, or
              private payment credentials. Campus Hub does not need these to
              investigate your issue.
            </p>
          </section>

          <div className="flex items-start gap-3 px-1 text-sm leading-6 text-slate-600">
            <Mail className="mt-1 h-4 w-4 shrink-0 text-cyan-700" />
            Check the email address you provide for future support updates.
          </div>
        </aside>

        <form
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          onSubmit={(event) => void submit(event)}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
              Public support request
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Tell us what happened
            </h2>
          </div>

          {ticketNumber && (
            <SupportNotice tone="success">
              <span>
                Your support request has been submitted. Please check your email
                for updates. Ticket: <strong>{ticketNumber}</strong>
              </span>
            </SupportNotice>
          )}
          {error && <SupportNotice tone="error">{error}</SupportNotice>}

          <div className="grid gap-5 sm:grid-cols-2">
            <PublicField label="Full Name">
              <input
                className={inputClass}
                maxLength={120}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                value={fullName}
              />
            </PublicField>
            <PublicField label="Email">
              <input
                className={inputClass}
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </PublicField>
          </div>

          <PublicField label="Issue Category">
            <select
              className={inputClass}
              onChange={(event) =>
                setCategory(event.target.value as SupportCategory | '')
              }
              value={category}
            >
              <option value="">Select your issue</option>
              {publicCategories.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </PublicField>

          <PublicField label="Subject">
            <input
              className={inputClass}
              maxLength={120}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="A short summary of the issue"
              value={subject}
            />
          </PublicField>

          <PublicField label="Description">
            <textarea
              className={`${inputClass} min-h-36 resize-y py-3`}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the problem, any error message, and what you already tried..."
              value={description}
            />
            <span className="mt-2 block text-xs text-slate-500">
              {description.trim().length}/2000 characters
            </span>
          </PublicField>

          <PublicField label="Attachment (optional)">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-600 hover:border-cyan-600">
              <Paperclip className="h-4 w-4" />
              {files.length
                ? `${files.length} file(s) selected`
                : 'Attach images or PDF'}
              <input
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="sr-only"
                multiple
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  const validation = validateSupportFiles(selected);
                  if (validation) setError(validation);
                  else {
                    setError('');
                    setFiles(selected);
                  }
                  event.target.value = '';
                }}
                type="file"
              />
            </label>
          </PublicField>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071b33] px-5 text-sm font-black text-white disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {submitting ? 'Submitting request...' : 'Submit Support Request'}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            Support requests are handled according to our{' '}
            <Link className="font-bold text-[#071b33]" to="/privacy-policy">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              className="font-bold text-[#071b33]"
              to="/terms-and-conditions"
            >
              Terms and Conditions
            </Link>
            . Payment concerns may also be covered by the{' '}
            <Link className="font-bold text-[#071b33]" to="/refund-policy">
              Refund Policy
            </Link>
            . For safer buying, selling, payments, and pickups, read our{' '}
            <Link className="font-bold text-[#071b33]" to="/safety-guidelines">
              Safety Guidelines
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';

function PublicField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-900">
        {label}
      </span>
      {children}
    </label>
  );
}
