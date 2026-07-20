import { CheckCircle2, ImagePlus, Info } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '../../student/components/StudentUi';
import { getCampusUser } from '../../student/lib/session';
import { categories } from '../data/mockData';

export function SellItemPage() {
  const [submitted, setSubmitted] = useState(false);
  const user = getCampusUser();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Add clear details so students at your college can decide quickly."
        eyebrow="Create listing"
        title="Sell an item"
      />
      {submitted && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <div>
            <strong>Test listing published.</strong>
            <p className="mt-0.5">
              It is available in My Marketplace for this browser session.
            </p>
          </div>
        </div>
      )}
      <form
        className="grid gap-6 xl:grid-cols-[1fr_320px]"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <FormSection
            description="Start with the essential information buyers scan first."
            title="Item details"
          >
            <Field label="Title">
              <input
                className={inputClass}
                placeholder="e.g. Engineering Mathematics book set"
                required
              />
            </Field>
            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-32 py-3`}
                placeholder="Describe condition, age, included accessories, and any defects."
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select className={inputClass} defaultValue="" required>
                  <option disabled value="">
                    Select a category
                  </option>
                  {categories.slice(1).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Condition">
                <select className={inputClass} defaultValue="Good">
                  {['New', 'Like New', 'Good', 'Fair', 'Used'].map(
                    (condition) => (
                      <option key={condition}>{condition}</option>
                    ),
                  )}
                </select>
              </Field>
            </div>
          </FormSection>
          <FormSection
            description="Use bright, clear photos of the actual item."
            title="Photos"
          >
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-cyan-600 hover:bg-cyan-50">
              <ImagePlus
                aria-hidden="true"
                className="h-8 w-8 text-slate-400"
              />
              <span className="mt-3 text-sm font-semibold text-slate-800">
                Choose up to 5 photos
              </span>
              <span className="mt-1 text-xs text-slate-500">
                PNG or JPG, maximum 5 MB each
              </span>
              <input
                accept="image/png,image/jpeg"
                className="sr-only"
                multiple
                type="file"
              />
            </label>
          </FormSection>
          <FormSection
            description="Set a fair campus price and pickup point."
            title="Price and handover"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                    ₹
                  </span>
                  <input
                    className={`${inputClass} pl-8`}
                    min="1"
                    placeholder="0"
                    required
                    type="number"
                  />
                </div>
              </Field>
              <Field label="Available quantity">
                <input
                  className={inputClass}
                  defaultValue="1"
                  min="1"
                  required
                  type="number"
                />
              </Field>
            </div>
            <Field label="Pickup location">
              <input
                className={inputClass}
                placeholder="e.g. Library entrance"
                required
              />
            </Field>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input className="h-4 w-4 accent-cyan-700" type="checkbox" />
              Price is negotiable
            </label>
          </FormSection>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700"
              type="button"
            >
              Save draft
            </button>
            <button
              className="h-11 rounded-lg bg-[#071b33] px-6 text-sm font-semibold text-white hover:bg-[#153557]"
              type="submit"
            >
              Publish test listing
            </button>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-950">Listing college</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {user.collegeName}
            </p>
            <div className="mt-4 flex gap-2 rounded-lg bg-cyan-50 p-3 text-xs leading-5 text-cyan-900">
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Your verified account sets this automatically.
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-950">Quick checklist</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              <li>Show the real item clearly</li>
              <li>Mention defects honestly</li>
              <li>Choose a public pickup area</li>
              <li>Do not list prohibited goods</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      {children}
    </label>
  );
}
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
