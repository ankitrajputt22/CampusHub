import {
  ArrowLeft,
  FileText,
  LifeBuoy,
  LoaderCircle,
  Paperclip,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createSupportTicket, supportCategories } from '../api/supportApi';
import type {
  SupportCategory,
  SupportRelatedEntityType,
} from '../api/supportApi';
import { SupportNotice } from '../components/SupportUi';
import { supportErrorMessage, validateSupportFiles } from '../lib/supportUtils';

const relatedOptions: Array<{
  value: SupportRelatedEntityType;
  label: string;
}> = [
  { value: 'NONE', label: 'Not linked to a specific record' },
  { value: 'LISTING', label: 'Listing' },
  { value: 'ORDER', label: 'Order' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'REPORT', label: 'Report' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'USER', label: 'My account' },
];

export function CreateSupportTicketPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<SupportCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [relatedType, setRelatedType] =
    useState<SupportRelatedEntityType>('NONE');
  const [relatedId, setRelatedId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const ticket = await createSupportTicket(
        {
          category: category as SupportCategory,
          subject: subject.trim(),
          description: description.trim(),
          relatedEntityType: relatedType,
          relatedEntityId:
            relatedType === 'NONE' ? null : Number.parseInt(relatedId, 10),
        },
        files,
      );
      navigate(`/student/support/${ticket.id}`, {
        state: { submitted: true, ticketNumber: ticket.ticketNumber },
      });
    } catch (caught) {
      setError(
        supportErrorMessage(
          caught,
          'Unable to submit support ticket. Please try again.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function validate() {
    if (!category) return 'Please select a category.';
    if (subject.trim().length < 5)
      return 'Subject must be at least 5 characters.';
    if (subject.trim().length > 120)
      return 'Subject must be no more than 120 characters.';
    if (description.trim().length < 20)
      return 'Description must be at least 20 characters.';
    if (description.trim().length > 2000)
      return 'Description must be no more than 2000 characters.';
    if (
      relatedType !== 'NONE' &&
      (!relatedId.trim() || Number.parseInt(relatedId, 10) < 1)
    ) {
      return 'Enter the ID of the related record.';
    }
    return validateSupportFiles(files);
  }

  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const next = [...files, ...selected].slice(0, 4);
    const validation = validateSupportFiles(next);
    if (validation) {
      setError(validation);
      event.target.value = '';
      return;
    }
    setFiles(next);
    setError('');
    event.target.value = '';
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[#42526a] hover:text-cyan-800"
        to="/student/support"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to support tickets
      </Link>

      <header className="rounded-2xl bg-[#031635] px-5 py-7 text-white sm:px-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-400 text-[#003846]">
            <LifeBuoy className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-300">
              New support request
            </p>
            <h1 className="mt-1 font-display text-3xl font-black">
              How can we help?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Add clear details so the support team can understand and review
              your request without unnecessary delays.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form
          className="space-y-5 rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm sm:p-7"
          onSubmit={(event) => void submit(event)}
        >
          {error && <SupportNotice tone="error">{error}</SupportNotice>}

          <Field label="Category" required>
            <select
              className={inputClass}
              onChange={(event) =>
                setCategory(event.target.value as SupportCategory | '')
              }
              value={category}
            >
              <option value="">Select the type of issue</option>
              {supportCategories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            helper={`${subject.trim().length}/120 characters`}
            label="Subject"
            required
          >
            <input
              className={inputClass}
              maxLength={120}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Briefly describe what went wrong"
              value={subject}
            />
          </Field>

          <Field
            helper={`${description.trim().length}/2000 characters · Include what you expected and what happened.`}
            label="Description"
            required
          >
            <textarea
              className={`${inputClass} min-h-44 resize-y py-3`}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Provide enough context for the support team to investigate your request..."
              value={description}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Related To" optional>
              <select
                className={inputClass}
                onChange={(event) => {
                  const value = event.target.value as SupportRelatedEntityType;
                  setRelatedType(value);
                  if (value === 'NONE') setRelatedId('');
                }}
                value={relatedType}
              >
                {relatedOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            {relatedType !== 'NONE' && (
              <Field
                helper="Use the numeric ID shown on the related page."
                label={`${relatedOptions.find((item) => item.value === relatedType)?.label} ID`}
                required
              >
                <input
                  className={inputClass}
                  min="1"
                  onChange={(event) => setRelatedId(event.target.value)}
                  placeholder="e.g. 1201"
                  type="number"
                  value={relatedId}
                />
              </Field>
            )}
          </div>

          <Field
            helper="JPG, PNG, WEBP, or PDF · Up to 3 files · 5 MB each"
            label="Attachments"
            optional
          >
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#9eabba] bg-slate-50 px-4 py-5 text-sm font-bold text-[#42526a] hover:border-cyan-600 hover:bg-cyan-50">
              <Paperclip className="h-4 w-4" />
              Add files
              <input
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="sr-only"
                multiple
                onChange={chooseFiles}
                type="file"
              />
            </label>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e0e5ec] px-3 py-2 text-sm"
                    key={`${file.name}-${file.lastModified}`}
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <button
                      aria-label={`Remove ${file.name}`}
                      className="shrink-0 rounded p-1 text-[#68707d] hover:bg-rose-50 hover:text-rose-700"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e6e8ee] pt-5 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#cbd3de] px-5 text-sm font-bold text-[#42526a]"
              to="/student/support"
            >
              Cancel
            </Link>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#031635] px-6 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Submitting ticket...
                </>
              ) : (
                'Submit Support Ticket'
              )}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 font-black text-amber-950">
              <ShieldAlert className="h-5 w-5" />
              Protect your credentials
            </div>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              Do not share your password, OTP, UPI PIN, full card details, or
              private payment credentials.
            </p>
          </section>
          <section className="rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-black text-[#031635]">
              <FileText className="h-5 w-5 text-cyan-700" />
              Helpful details
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5d6a7d]">
              <li>• What action you were trying to complete</li>
              <li>• Any error message shown on screen</li>
              <li>• Relevant listing, order, payment, or report ID</li>
              <li>• A screenshot with private information hidden</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-[#cbd3de] bg-white px-4 text-sm text-[#172a43] outline-none transition placeholder:text-[#8b96a5] focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';

function Field({
  label,
  helper,
  required,
  optional,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#13233a]">
        {label}
        {required && <span className="text-rose-600">*</span>}
        {optional && (
          <span className="text-xs font-medium text-[#8a95a4]">Optional</span>
        )}
      </span>
      {children}
      {helper && (
        <span className="mt-2 block text-xs leading-5 text-[#778294]">
          {helper}
        </span>
      )}
    </label>
  );
}
