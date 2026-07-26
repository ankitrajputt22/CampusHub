import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import {
  BadgeIndianRupee,
  CheckCircle2,
  CircleHelp,
  GraduationCap,
  LoaderCircle,
  MapPin,
  PackagePlus,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { getCampusUser } from '../../student/lib/session';
import {
  createMarketplaceListing,
  type CreateListingPayload,
} from '../api/marketplaceApi';
import { ImageUploadSection } from '../components/sell/ImageUploadSection';
import {
  ListingPreviewCard,
  type ListingPreview,
} from '../components/sell/ListingPreviewCard';
import { SellingGuidanceCards } from '../components/sell/SellingGuidanceCards';

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

const conditions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'USED', label: 'Used' },
] as const;

const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must contain at least 5 characters.')
    .max(100, 'Title cannot exceed 100 characters.'),
  category: z.enum(categories, {
    errorMap: () => ({ message: 'Select a product category.' }),
  }),
  description: z
    .string()
    .trim()
    .min(20, 'Description must contain at least 20 characters.')
    .max(1000, 'Description cannot exceed 1000 characters.'),
  price: z.coerce
    .number()
    .min(1, 'Price must be at least ₹1.')
    .max(100000, 'Price cannot exceed ₹1,00,000.'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'USED']),
  pickupLocation: z
    .string()
    .trim()
    .min(2, 'Pickup location must contain at least 2 characters.')
    .max(100, 'Pickup location cannot exceed 100 characters.'),
  negotiable: z.boolean(),
  availableQuantity: z.coerce
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(50, 'Quantity cannot exceed 50.'),
  additionalNotes: z
    .string()
    .trim()
    .max(500, 'Additional notes cannot exceed 500 characters.'),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxImageSize = 2 * 1024 * 1024;

export function SellItemPage() {
  const navigate = useNavigate();
  const user = getCampusUser();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Array<string | null>>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      category: undefined,
      description: '',
      price: 0,
      condition: 'GOOD',
      pickupLocation: '',
      negotiable: true,
      availableQuantity: 1,
      additionalNotes: '',
    },
  });

  const formValues = watch();
  const preview: ListingPreview = {
    title: formValues.title ?? '',
    category: formValues.category ?? '',
    price: Number(formValues.price) || 0,
    condition: formValues.condition ?? 'GOOD',
    pickupLocation: formValues.pickupLocation ?? '',
    negotiable: formValues.negotiable ?? true,
  };

  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') {
      setPreviewUrls(images.map(() => null));
      return;
    }
    const urls = images.map((image) => URL.createObjectURL(image));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  function addImages(selectedFiles: File[]) {
    setImageError(null);
    if (selectedFiles.length === 0) return;
    if (images.length + selectedFiles.length > 5) {
      setImageError('You can upload a maximum of 5 product images.');
      return;
    }
    const unsupported = selectedFiles.find(
      (file) => !acceptedImageTypes.has(file.type),
    );
    if (unsupported) {
      setImageError('Only JPG, JPEG, PNG, and WEBP files are allowed.');
      return;
    }
    const oversized = selectedFiles.find((file) => file.size > maxImageSize);
    if (oversized) {
      setImageError('Each image must be less than 2 MB.');
      return;
    }
    setImages((current) => [...current, ...selectedFiles]);
  }

  function removeImage(index: number) {
    setImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setImageError(null);
  }

  async function submit(values: ListingFormValues) {
    if (images.length === 0) {
      setImageError('Add at least one product image before posting.');
      return;
    }
    setSubmitError(null);
    setSuccess(false);

    const payload: CreateListingPayload = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      pickupLocation: values.pickupLocation.trim(),
      additionalNotes: values.additionalNotes.trim() || null,
    };

    try {
      const listing = await createMarketplaceListing(payload, images);
      setSuccess(true);
      navigate(`/listing/${listing.id}`, {
        replace: true,
        state: { listingCreated: true },
      });
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  }

  const canSubmit = isValid && images.length > 0 && !isSubmitting;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-[#dce2eb] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#007b95]">
            Create a trusted campus listing
          </p>
          <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-[-0.035em] text-[#071b33] sm:text-3xl">
            Sell an item in {user.collegeName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Verified campus
            </span>
            <span className="text-sm text-[#667386]">
              Only verified students from your college can view this listing.
            </span>
          </div>
        </div>
        <a
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-[#25384f] transition hover:bg-[#e5eeff]"
          href="#selling-guidance"
        >
          <CircleHelp aria-hidden="true" className="h-4 w-4" />
          Selling guide
        </a>
      </header>

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
          Listing created successfully. Opening the product page…
        </div>
      )}

      <form
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <div className="space-y-6">
          <FormSection
            description="These details appear on marketplace cards and search results."
            icon={<PackagePlus className="h-5 w-5" />}
            title="Item details"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadOnlyContext
                icon={<GraduationCap className="h-4 w-4" />}
                label="College context"
                value={`${user.collegeName} · Verified`}
              />
              <ReadOnlyContext
                icon={<UserRound className="h-4 w-4" />}
                label="Seller profile"
                value={`${user.fullName} · ${user.trustScore}/100 Trust`}
              />
            </div>
            <p className="rounded-xl bg-[#f2f8fc] px-4 py-3 text-xs leading-5 text-[#597084]">
              Your verified account automatically fixes the seller and college.
              Neither value can be changed for this listing.
            </p>

            <FormField
              error={errors.title?.message}
              label="Product title"
              required
            >
              <input
                className={inputClass(Boolean(errors.title))}
                maxLength={100}
                placeholder="Enter product title"
                {...register('title')}
              />
              <CharacterCount
                current={(formValues.title ?? '').length}
                maximum={100}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                error={errors.category?.message}
                label="Category"
                required
              >
                <select
                  className={inputClass(Boolean(errors.category))}
                  defaultValue=""
                  {...register('category')}
                >
                  <option disabled value="">
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                error={errors.condition?.message}
                label="Condition"
                required
              >
                <select
                  className={inputClass(Boolean(errors.condition))}
                  {...register('condition')}
                >
                  {conditions.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField
              error={errors.description?.message}
              label="Description"
              required
            >
              <textarea
                className={`${inputClass(Boolean(errors.description))} min-h-36 resize-y py-3`}
                maxLength={1000}
                placeholder="Describe the item condition, usage, reason for selling, and any important details..."
                {...register('description')}
              />
              <CharacterCount
                current={(formValues.description ?? '').length}
                maximum={1000}
              />
            </FormField>
          </FormSection>

          <ImageUploadSection
            error={imageError}
            files={images}
            onAdd={addImages}
            onRemove={removeImage}
            previewUrls={previewUrls}
          />

          <FormSection
            description="Use a fair price and a general, public handover location."
            icon={<BadgeIndianRupee className="h-5 w-5" />}
            title="Price and campus handover"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField error={errors.price?.message} label="Price" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#687587]">
                    ₹
                  </span>
                  <input
                    className={`${inputClass(Boolean(errors.price))} pl-8`}
                    max="100000"
                    min="1"
                    placeholder="Enter price"
                    type="number"
                    {...register('price')}
                  />
                </div>
              </FormField>
              <FormField
                error={errors.availableQuantity?.message}
                label="Available quantity"
                required
              >
                <input
                  className={inputClass(Boolean(errors.availableQuantity))}
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
              required
            >
              <div className="relative">
                <MapPin
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788496]"
                />
                <input
                  className={`${inputClass(Boolean(errors.pickupLocation))} pl-10`}
                  maxLength={100}
                  placeholder="Enter pickup location inside campus"
                  {...register('pickupLocation')}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-[#788496]">
                Use a general place such as Library Gate or Main Canteen. Do not
                enter a room number or private address.
              </p>
            </FormField>

            <FormField label="Is the price negotiable?" required>
              <Controller
                control={control}
                name="negotiable"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-3">
                    <NegotiableChoice
                      active={field.value}
                      label="Negotiable"
                      onClick={() => field.onChange(true)}
                    />
                    <NegotiableChoice
                      active={!field.value}
                      label="Fixed price"
                      onClick={() => field.onChange(false)}
                    />
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
                className={`${inputClass(Boolean(errors.additionalNotes))} min-h-24 resize-y py-3`}
                maxLength={500}
                placeholder="Add handover instructions or other useful details..."
                {...register('additionalNotes')}
              />
              <CharacterCount
                current={(formValues.additionalNotes ?? '').length}
                maximum={500}
              />
            </FormField>
          </FormSection>

          <div className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] sm:p-6">
            <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <ShieldAlert
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-700"
              />
              <div>
                <p className="text-sm font-black text-rose-950">
                  Prohibited items warning
                </p>
                <p className="mt-1 text-xs leading-5 text-rose-900">
                  Illegal, stolen, dangerous, counterfeit, adult, or restricted
                  items—including alcohol, drugs, and weapons—are not allowed.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#687587]">
              By posting, you confirm that the item belongs to you, the details
              are accurate, and the listing follows Campus Hub marketplace
              rules.
            </p>
            <button
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#031635] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#153557] disabled:cursor-not-allowed disabled:bg-[#aeb8c5]"
              disabled={!canSubmit}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  Creating your listing...
                </>
              ) : (
                <>
                  <PackagePlus aria-hidden="true" className="h-4 w-4" />
                  Post Listing
                </>
              )}
            </button>
            {!canSubmit && !isSubmitting && (
              <p className="mt-2 text-center text-xs text-[#788496]">
                Complete every required field and add at least one image.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <ListingPreviewCard
            coverImageUrl={previewUrls[0] ?? null}
            listing={preview}
            user={user}
          />
          <SellingGuidanceCards category={formValues.category ?? ''} />
        </aside>
      </form>
    </div>
  );
}

function ReadOnlyContext({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.09em] text-[#667386]">
        {label}
      </p>
      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#c8d4e2] bg-[#eff4ff] px-3 text-sm font-bold text-[#25384f]">
        <span className="shrink-0 text-[#007b95]">{icon}</span>
        <span className="line-clamp-2">{value}</span>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#007b95]">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-black text-[#10233d]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#667386]">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required = false,
  optional = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#25384f]">
        {label}
        {required && <span className="text-rose-600">*</span>}
        {optional && (
          <span className="text-xs font-medium text-[#8a95a4]">Optional</span>
        )}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs font-semibold text-rose-700">
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
    <span className="mt-1.5 block text-right text-[11px] font-semibold text-[#8a95a4]">
      {current}/{maximum}
    </span>
  );
}

function NegotiableChoice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`h-11 rounded-xl border text-sm font-bold transition ${
        active
          ? 'border-[#007b95] bg-cyan-50 text-[#006d84] ring-1 ring-[#007b95]'
          : 'border-[#c4ceda] bg-white text-[#5f6d80] hover:border-[#8fa0b3]'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function inputClass(hasError: boolean) {
  return `h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#25384f] outline-none transition placeholder:text-[#9aa5b3] ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
      : 'border-[#c4ceda] focus:border-[#00a7c4] focus:ring-2 focus:ring-cyan-100'
  }`;
}

function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      'Unable to create the listing. Please check your details and try again.'
    );
  }
  return 'Unable to create the listing. Please check your details and try again.';
}
