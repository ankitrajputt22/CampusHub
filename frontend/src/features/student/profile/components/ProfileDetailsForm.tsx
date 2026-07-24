import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Check,
  Github,
  GraduationCap,
  Linkedin,
  LoaderCircle,
  MapPin,
  Save,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getApiErrorMessage } from '../../../auth/api/authApi';
import type { ProfileUpdatePayload, StudentProfile } from '../types';

const departments = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Artificial Intelligence and Data Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Commerce',
  'Economics',
  'English',
  'Management',
  'Law',
  'Medical',
  'Architecture',
] as const;

const courses = [
  'B.Tech',
  'M.Tech',
  'B.Sc',
  'M.Sc',
  'BCA',
  'MCA',
  'BBA',
  'MBA',
  'BA',
  'MA',
  'B.Com',
  'M.Com',
  'PhD',
  'Diploma',
] as const;

const studyYears = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Final Year',
  'Alumni',
  'Research Scholar',
] as const;

const profileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .min(3, 'Full name must be at least 3 characters.')
      .regex(
        /^[\p{L}]+(?:[ .'-][\p{L}]+)*$/u,
        'Please enter a valid full name.',
      ),
    bio: z.string().max(250, 'Bio should not exceed 250 characters.'),
    hostelArea: z
      .string()
      .trim()
      .min(1, 'Hostel / campus area is required.')
      .min(2, 'Please enter a valid hostel / campus area.'),
    departmentOption: z.string().min(1, 'Please select your department.'),
    customDepartment: z.string(),
    courseOption: z.string().min(1, 'Please select your course.'),
    customCourse: z.string(),
    yearOption: z.string().min(1, 'Please select your year of study.'),
    customYear: z.string(),
    rollNumber: z
      .string()
      .refine(
        (value) => !value.trim() || value.trim().length >= 3,
        'Please enter a valid roll number / enrollment number.',
      ),
    linkedinUrl: z
      .string()
      .refine(
        (value) => !value.trim() || validSocialUrl(value, 'linkedin.com'),
        'Please enter a valid LinkedIn URL.',
      ),
    githubUrl: z
      .string()
      .refine(
        (value) => !value.trim() || validSocialUrl(value, 'github.com'),
        'Please enter a valid GitHub URL.',
      ),
  })
  .superRefine((values, context) => {
    if (
      values.departmentOption === 'Other' &&
      !values.customDepartment.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customDepartment'],
        message: 'Please enter your department / branch.',
      });
    }
    if (values.courseOption === 'Other' && !values.customCourse.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customCourse'],
        message: 'Please enter your course.',
      });
    }
    if (values.yearOption === 'Other' && !values.customYear.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customYear'],
        message: 'Please enter your year/status.',
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

const inputClass =
  'h-11 w-full rounded-lg border border-[#c5c6cf] bg-white px-3 text-sm text-[#0b1c30] outline-none transition placeholder:text-[#858993] focus:border-[#00677f] focus:ring-2 focus:ring-cyan-100';

export function ProfileDetailsForm({
  profile,
  onSave,
}: {
  profile: StudentProfile;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
}) {
  const defaults = useMemo(() => formDefaults(profile), [profile]);
  const [status, setStatus] = useState<
    { tone: 'success' | 'error'; message: string } | undefined
  >();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const departmentOption = watch('departmentOption');
  const courseOption = watch('courseOption');
  const yearOption = watch('yearOption');
  const bio = watch('bio') ?? '';

  async function submit(values: ProfileFormValues) {
    setStatus(undefined);
    const payload: ProfileUpdatePayload = {
      fullName: values.fullName.trim(),
      bio: values.bio.trim(),
      hostelArea: values.hostelArea.trim(),
      department:
        values.departmentOption === 'Other'
          ? values.customDepartment.trim()
          : values.departmentOption,
      course:
        values.courseOption === 'Other'
          ? values.customCourse.trim()
          : values.courseOption,
      yearOfStudy:
        values.yearOption === 'Other'
          ? values.customYear.trim()
          : values.yearOption,
      rollNumber: values.rollNumber.trim(),
      linkedinUrl: values.linkedinUrl.trim(),
      githubUrl: values.githubUrl.trim(),
    };
    try {
      await onSave(payload);
      setStatus({
        tone: 'success',
        message: 'Profile updated successfully.',
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message:
          getApiErrorMessage(error) ||
          'Unable to update profile. Please check your details and try again.',
      });
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => void handleSubmit(submit)(event)}
    >
      <Section
        description="Details that help other verified students understand who they are dealing with."
        icon={UserRound}
        id="profile-details"
        title="Personal details"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.fullName?.message} label="Full name" required>
            <input
              autoComplete="name"
              className={inputClass}
              id="profile-full-name"
              {...register('fullName')}
            />
          </Field>
          <Field
            error={errors.hostelArea?.message}
            label="Hostel / campus area"
            required
          >
            <div className="relative">
              <MapPin
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8293b8]"
              />
              <input
                className={`${inputClass} pl-10`}
                id="profile-hostel"
                placeholder="Main Campus, Hostel Block A, Day Scholar..."
                {...register('hostelArea')}
              />
            </div>
          </Field>
        </div>
        <Field
          error={errors.bio?.message}
          hint={`${bio.length}/250`}
          label="Bio"
        >
          <textarea
            className={`${inputClass} min-h-28 resize-y py-3`}
            id="profile-bio"
            placeholder="Write a short bio about yourself..."
            {...register('bio')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.linkedinUrl?.message} label="LinkedIn URL">
            <div className="relative">
              <Linkedin
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0a66c2]"
              />
              <input
                className={`${inputClass} pl-10`}
                id="profile-linkedin"
                inputMode="url"
                placeholder="https://linkedin.com/in/username"
                type="url"
                {...register('linkedinUrl')}
              />
            </div>
          </Field>
          <Field error={errors.githubUrl?.message} label="GitHub URL">
            <div className="relative">
              <Github
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#031635]"
              />
              <input
                className={`${inputClass} pl-10`}
                id="profile-github"
                inputMode="url"
                placeholder="https://github.com/username"
                type="url"
                {...register('githubUrl')}
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section
        description="Keep your branch, course, and current academic status accurate."
        icon={GraduationCap}
        id="profile-academic"
        title="Academic details"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            error={errors.departmentOption?.message}
            label="Department / branch"
            required
          >
            <select className={inputClass} {...register('departmentOption')}>
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department}>{department}</option>
              ))}
              <option>Other</option>
            </select>
          </Field>
          {departmentOption === 'Other' && (
            <Field
              error={errors.customDepartment?.message}
              label="Custom department / branch"
              required
            >
              <input className={inputClass} {...register('customDepartment')} />
            </Field>
          )}
          <Field error={errors.courseOption?.message} label="Course" required>
            <select className={inputClass} {...register('courseOption')}>
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course}>{course}</option>
              ))}
              <option>Other</option>
            </select>
          </Field>
          {courseOption === 'Other' && (
            <Field
              error={errors.customCourse?.message}
              label="Custom course"
              required
            >
              <input className={inputClass} {...register('customCourse')} />
            </Field>
          )}
          <Field
            error={errors.yearOption?.message}
            label="Year of study"
            required
          >
            <select className={inputClass} {...register('yearOption')}>
              <option value="">Select year or status</option>
              {studyYears.map((year) => (
                <option key={year}>{year}</option>
              ))}
              <option>Other</option>
            </select>
          </Field>
          {yearOption === 'Other' && (
            <Field
              error={errors.customYear?.message}
              label="Custom year / status"
              required
            >
              <input className={inputClass} {...register('customYear')} />
            </Field>
          )}
          <Field
            error={errors.rollNumber?.message}
            label="Roll / enrollment number"
          >
            <div className="relative">
              <BookOpen
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8293b8]"
              />
              <input
                className={`${inputClass} pl-10`}
                placeholder="Optional"
                {...register('rollNumber')}
              />
            </div>
          </Field>
        </div>
      </Section>

      {status && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            status.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          role="status"
        >
          {status.tone === 'success' && (
            <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {status.message}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[#e6e8ee] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#68707d]">
          Verified identity fields are locked in the section below.
        </p>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#031635] px-5 text-sm font-bold text-white transition hover:bg-[#1a3153] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={isSubmitting || !isDirty}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="h-4 w-4" />
          )}
          {isSubmitting ? 'Saving changes…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Section({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section
      className="scroll-mt-28 rounded-2xl border border-[#d6d9e2] bg-white p-5 shadow-[0_3px_12px_rgba(3,22,53,0.04)] sm:p-6"
      id={id}
    >
      <div className="mb-5 flex items-start gap-3 border-b border-[#e6e8ee] pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5eeff] text-[#364768]">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-[#031635]">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#68707d]">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required = false,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-[#263346]">
        <span>
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </span>
        {hint && (
          <span className="text-xs font-normal text-[#858993]">{hint}</span>
        )}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

function formDefaults(profile: StudentProfile): ProfileFormValues {
  const departmentKnown = departments.includes(
    profile.department as (typeof departments)[number],
  );
  const courseKnown = courses.includes(
    profile.course as (typeof courses)[number],
  );
  const yearKnown = studyYears.includes(
    profile.yearOfStudy as (typeof studyYears)[number],
  );
  return {
    fullName: profile.fullName,
    bio: profile.bio ?? '',
    hostelArea: profile.hostelArea,
    departmentOption: departmentKnown ? profile.department : 'Other',
    customDepartment: departmentKnown ? '' : profile.department,
    courseOption: courseKnown ? profile.course : 'Other',
    customCourse: courseKnown ? '' : profile.course,
    yearOption: yearKnown ? profile.yearOfStudy : 'Other',
    customYear: yearKnown ? '' : profile.yearOfStudy,
    rollNumber: profile.rollNumber ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
  };
}

function validSocialUrl(value: string, expectedHost: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      (url.hostname === expectedHost ||
        url.hostname.endsWith(`.${expectedHost}`))
    );
  } catch {
    return false;
  }
}
