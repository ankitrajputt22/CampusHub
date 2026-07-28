import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  BadgeIndianRupee,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  PackageOpen,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { resolveApiAssetUrl } from '../../../lib/apiClient';
import {
  getMyListing,
  type CreateListingPayload,
  type MyListingDetails,
  updateMarketplaceListing,
} from '../api/marketplaceApi';

const categories = [
  'Books',
  'Notes',
  'Electronics',
  'Bicycles',
  'Hostel Essentials',
  'Furniture',
  'Lab Equipment',
  'Stationery',
  'Clothing',
  'Others',
] as const;

const listingSchema = z.object({
  title: z.string().trim().min(5).max(100),
  category: z.enum(categories),
  description: z.string().trim().min(20).max(1000),
  price: z.coerce.number().min(1).max(100000),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'USED']),
  pickupLocation: z.string().trim().min(2).max(100),
  negotiable: z.boolean(),
  availableQuantity: z.coerce.number().int().min(1).max(50),
  additionalNotes: z.string().trim().max(500),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const inputClass =
  'h-11 w-full rounded-xl border border-[#cfd8e5] bg-white px-3 text-sm text-[#10233d] outline-none transition placeholder:text-[#8a96a5] focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100';
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxImageSize = 2 * 1024 * 1024;

export function EditListingPage() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const numericListingId = Number(listingId);
  const [listing, setListing] = useState<MyListingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [replacementImages, setReplacementImages] = useState<File[]>([]);
  const [replacementUrls, setReplacementUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      category: 'Books',
      description: '',
      price: 1,
      condition: 'GOOD',
      pickupLocation: '',
      negotiable: true,
      availableQuantity: 1,
      additionalNotes: '',
    },
  });
  const values = watch();

  useEffect(() => {
    if (!Number.isInteger(numericListingId) || numericListingId < 1) {
      setLoadError('This listing link is invalid.');
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    getMyListing(numericListingId, controller.signal)
      .then((result) => {
        setListing(result);
        reset({
          title: result.title,
          category: result.category as ListingFormValues['category'],
          description: result.description,
          price: result.price,
          condition: result.condition as ListingFormValues['condition'],
          pickupLocation: result.pickupLocation,
          negotiable: result.negotiable,
          availableQuantity: result.availableQuantity,
          additionalNotes: result.additionalNotes ?? '',
        });
      })
      .catch((error: unknown) => {
        if (isAxiosError(error) && error.code === 'ERR_CANCELED') return;
        setLoadError(apiErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [numericListingId, reset]);

  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return;
    const urls = replacementImages.map((file) => URL.createObjectURL(file));
    setReplacementUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [replacementImages]);

  function addReplacementImages(files: File[]) {
    setImageError(null);
    if (files.length > 5) {
      setImageError('You can upload a maximum of 5 replacement images.');
      return;
    }
    if (files.some((file) => !acceptedImageTypes.has(file.type))) {
      setImageError('Only JPG, JPEG, PNG, and WEBP files are allowed.');
      return;
    }
    if (files.some((file) => file.size > maxImageSize)) {
      setImageError('Each image must be less than 2 MB.');
      return;
    }
    setReplacementImages(files);
  }

  async function submit(formValues: ListingFormValues) {
    if (!listing) return;
    setSubmitError(null);
    setSuccess(false);
    const payload: CreateListingPayload = {
      ...formValues,
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      pickupLocation: formValues.pickupLocation.trim(),
      additionalNotes: formValues.additionalNotes.trim() || null,
    };
    try {
      await updateMarketplaceListing(listing.id, payload, replacementImages);
      setSuccess(true);
      navigate('/student/my-marketplace', {
        replace: true,
        state: { listingUpdated: true },
      });
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[420px] items-center justify-center"
        role="status"
      >
        <LoaderCircle
          aria-hidden="true"
          className="h-8 w-8 animate-spin text-[#007b95]"
        />
        <span className="ml-3 font-bold text-[#506176]">Loading listing…</span>
      </div>
    );
  }

  if (loadError || !listing) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center">
        <PackageOpen
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-rose-500"
        />
        <h1 className="mt-4 text-xl font-black text-[#10233d]">
          Listing could not be opened
        </h1>
        <p className="mt-2 text-sm text-[#687587]">
          {loadError ?? 'This listing is unavailable.'}
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#071b33] px-4 text-sm font-bold text-white"
          to="/student/my-marketplace"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to My Marketplace
        </Link>
      </section>
    );
  }

  const canEdit = listing.status === 'ACTIVE' || listing.status === 'INACTIVE';

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-[#dce2eb] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#506176] hover:text-[#007b95]"
            to="/student/my-marketplace"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            My Marketplace
          </Link>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Listing #{listing.id}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            Edit listing
          </h1>
          <p className="mt-2 text-sm text-[#667386]">
            Update buyer-facing details without changing the verified seller or
            college.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800 sm:self-auto">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          {listing.collegeName}
        </span>
      </header>

      {!canEdit && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          role="alert"
        >
          {listing.status.replace('_', ' ')} listings cannot be edited. Return
          to My Marketplace to manage its status.
        </div>
      )}
      {submitError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          role="alert"
        >
          {submitError}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Listing updated successfully.
        </div>
      )}

      <form
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <div className="space-y-6">
          <FormSection title="Item details">
            <FormField error={errors.title?.message} label="Product title">
              <input
                className={inputClass}
                disabled={!canEdit}
                maxLength={100}
                {...register('title')}
              />
              <CharacterCount current={values.title.length} maximum={100} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField error={errors.category?.message} label="Category">
                <select
                  className={inputClass}
                  disabled={!canEdit}
                  {...register('category')}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField error={errors.condition?.message} label="Condition">
                <select
                  className={inputClass}
                  disabled={!canEdit}
                  {...register('condition')}
                >
                  <option value="NEW">New</option>
                  <option value="LIKE_NEW">Like New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="USED">Used</option>
                </select>
              </FormField>
            </div>
            <FormField error={errors.description?.message} label="Description">
              <textarea
                className={`${inputClass} min-h-36 resize-y py-3`}
                disabled={!canEdit}
                maxLength={1000}
                {...register('description')}
              />
              <CharacterCount
                current={values.description.length}
                maximum={1000}
              />
            </FormField>
          </FormSection>

          <FormSection title="Price and handover">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField error={errors.price?.message} label="Price">
                <div className="relative">
                  <BadgeIndianRupee
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
                  />
                  <input
                    className={`${inputClass} pl-10`}
                    disabled={!canEdit}
                    max="100000"
                    min="1"
                    type="number"
                    {...register('price')}
                  />
                </div>
              </FormField>
              <FormField
                error={errors.availableQuantity?.message}
                label="Available quantity"
              >
                <input
                  className={inputClass}
                  disabled={!canEdit}
                  max="50"
                  min="1"
                  type="number"
                  {...register('availableQuantity')}
                />
              </FormField>
            </div>
            <FormField
              error={errors.pickupLocation?.message}
              label="Pickup location"
            >
              <div className="relative">
                <MapPin
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
                />
                <input
                  className={`${inputClass} pl-10`}
                  disabled={!canEdit}
                  maxLength={100}
                  {...register('pickupLocation')}
                />
              </div>
            </FormField>
            <FormField label="Price negotiability">
              <Controller
                control={control}
                name="negotiable"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Negotiable', value: true },
                      { label: 'Fixed price', value: false },
                    ].map((option) => (
                      <button
                        aria-pressed={field.value === option.value}
                        className={`h-11 rounded-xl border text-sm font-bold transition ${
                          field.value === option.value
                            ? 'border-[#00a7c4] bg-cyan-50 text-[#006f86]'
                            : 'border-[#cfd8e5] text-[#506176] hover:border-[#9fb0c4]'
                        }`}
                        disabled={!canEdit}
                        key={option.label}
                        onClick={() => field.onChange(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </FormField>
            <FormField
              error={errors.additionalNotes?.message}
              label="Additional notes"
              optional
            >
              <textarea
                className={`${inputClass} min-h-24 resize-y py-3`}
                disabled={!canEdit}
                maxLength={500}
                placeholder="Accessories, preferred timing, or handover notes"
                {...register('additionalNotes')}
              />
            </FormField>
          </FormSection>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)]">
            <h2 className="text-base font-black text-[#10233d]">
              Product images
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#687587]">
              Keep the current gallery, or select 1–5 files to replace every
              existing image.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(replacementUrls.length > 0
                ? replacementUrls
                : listing.images
              ).map((url, index) => (
                <div
                  className="relative aspect-square overflow-hidden rounded-lg border border-[#dce2eb] bg-[#eef3f8]"
                  key={`${url}-${index}`}
                >
                  <img
                    alt={`Product ${index + 1}`}
                    className="h-full w-full object-cover"
                    src={
                      replacementUrls.length > 0
                        ? url
                        : (resolveApiAssetUrl(url) ?? undefined)
                    }
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-[#071b33] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {listing.images.length === 0 && replacementUrls.length === 0 && (
                <div className="col-span-3 flex h-24 items-center justify-center rounded-xl bg-[#eef3f8] text-[#788496]">
                  <PackageOpen aria-hidden="true" className="h-8 w-8" />
                </div>
              )}
            </div>
            {replacementImages.length > 0 && (
              <button
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-700"
                onClick={() => {
                  setReplacementImages([]);
                  setImageError(null);
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                Keep current gallery instead
              </button>
            )}
            {canEdit && (
              <label className="mt-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#bfcbd9] text-xs font-black text-[#31506d] transition hover:border-[#00a7c4] hover:bg-cyan-50">
                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                Select replacement images
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  multiple
                  onChange={(event) => {
                    addReplacementImages(Array.from(event.target.files ?? []));
                    event.target.value = '';
                  }}
                  type="file"
                />
              </label>
            )}
            {imageError && (
              <p className="mt-3 text-xs font-semibold text-rose-700">
                {imageError}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#dce2eb] bg-[#f5f8fc] p-5">
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#63758a]">
              Fixed account context
            </p>
            <p className="mt-3 text-sm font-black text-[#10233d]">
              {listing.sellerName}
            </p>
            <p className="mt-1 text-xs text-[#687587]">{listing.collegeName}</p>
            <p className="mt-3 text-xs leading-5 text-[#687587]">
              Seller and college identity are always taken from your signed-in
              account and cannot be edited here.
            </p>
          </section>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071b33] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0c2a4c] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || !isValid || isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {isSubmitting ? 'Saving changes…' : 'Save changes'}
          </button>
        </aside>
      </form>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] sm:p-6">
      <h2 className="text-lg font-black text-[#10233d]">{title}</h2>
      {children}
    </section>
  );
}

function FormField({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#1b2f47]">
        {label}
        {optional && (
          <span className="text-xs font-medium text-[#8490a0]">Optional</span>
        )}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-semibold text-rose-700">
          {error}
        </span>
      )}
    </label>
  );
}

function CharacterCount({
  current,
  maximum,
}: {
  current: number;
  maximum: number;
}) {
  return (
    <span className="mt-1 block text-right text-[11px] text-[#8490a0]">
      {current}/{maximum}
    </span>
  );
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }
  return 'Unable to update this listing. Please try again.';
}
