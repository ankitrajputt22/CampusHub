import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import {
  type CollegeSummary,
  checkEmailAvailability,
  checkPhoneAvailability,
  getApiErrorMessage,
  resendEmailOtp,
  resendPhoneOtp,
  searchColleges,
  startSignup,
  verifySignupOtp,
} from '../api/authApi';
import { AuthShowcase } from '../components/AuthShowcase';

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
  'Other',
];

const years = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Final Year',
  'Alumni',
  'Research Scholar',
  'Other',
];

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
  'Other',
];

const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required.')
      .min(3, 'Full name must be at least 3 characters.')
      .regex(/^[A-Za-z ]+$/, 'Please enter a valid full name.'),
    collegeId: z
      .number({ required_error: 'Please select your college.' })
      .positive(),
    collegeName: z.string().min(1, 'Please select your college.'),
    collegeEmail: z
      .string()
      .min(1, 'College email is required.')
      .email('Please enter a valid email address.'),
    password: z
      .string()
      .min(1, 'Password is required.')
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must contain one special character.'),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
    department: z.string().min(1, 'Please select your department / branch.'),
    customDepartment: z.string().optional(),
    yearOfStudy: z.string().min(1, 'Please select your year of study.'),
    customYearOfStudy: z.string().optional(),
    rollNumber: z
      .string()
      .max(80, 'Please enter a valid roll number / enrollment number.')
      .optional(),
    course: z.string().min(1, 'Please select your course.'),
    customCourse: z.string().optional(),
    countryCode: z.string().min(1),
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required.')
      .regex(/^[0-9]{10}$/, 'Please enter a valid phone number.'),
    hostelOrCampusArea: z
      .string()
      .min(1, 'Hostel / campus area is required.')
      .min(2, 'Please enter a valid hostel / campus area.'),
    profilePhotoFileName: z.string().optional(),
    emailOtp: z
      .string()
      .regex(/^\d{6}$/, 'Please enter a valid 6-digit OTP.')
      .optional(),
    phoneOtp: z
      .string()
      .regex(/^\d{6}$/, 'Please enter a valid 6-digit OTP.')
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password and confirm password do not match.',
  })
  .refine(
    (data) =>
      data.department !== 'Other' || Boolean(data.customDepartment?.trim()),
    {
      path: ['customDepartment'],
      message: 'Please enter your department / branch.',
    },
  )
  .refine(
    (data) =>
      data.yearOfStudy !== 'Other' || Boolean(data.customYearOfStudy?.trim()),
    {
      path: ['customYearOfStudy'],
      message: 'Please enter your year/status.',
    },
  )
  .refine(
    (data) => data.course !== 'Other' || Boolean(data.customCourse?.trim()),
    {
      path: ['customCourse'],
      message: 'Please enter your course.',
    },
  );

type SignupFormValues = z.infer<typeof signupSchema>;

const stepFields = [
  [
    'fullName',
    'collegeId',
    'collegeName',
    'collegeEmail',
    'password',
    'confirmPassword',
  ],
  [
    'department',
    'customDepartment',
    'yearOfStudy',
    'customYearOfStudy',
    'rollNumber',
    'course',
    'customCourse',
  ],
  ['countryCode', 'phoneNumber', 'hostelOrCampusArea', 'profilePhotoFileName'],
  ['emailOtp', 'phoneOtp'],
] satisfies (keyof SignupFormValues)[][];

const stepLabels = ['Basic Details', 'Academic', 'Campus', 'Verify'];

export function SignupPage() {
  const [step, setStep] = useState(0);
  const [collegeKeyword, setCollegeKeyword] = useState('');
  const [collegeOptions, setCollegeOptions] = useState<CollegeSummary[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<CollegeSummary | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [devCodes, setDevCodes] = useState<{
    emailOtp?: string;
    phoneOtp?: string;
  }>({});
  const [successTrustScore, setSuccessTrustScore] = useState<number | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      countryCode: '+91',
      fullName: '',
      collegeName: '',
      collegeEmail: '',
      password: '',
      confirmPassword: '',
      department: '',
      yearOfStudy: '',
      rollNumber: '',
      course: '',
      phoneNumber: '',
      hostelOrCampusArea: '',
      emailOtp: '',
      phoneOtp: '',
    },
  });

  const password = watch('password');
  const department = watch('department');
  const yearOfStudy = watch('yearOfStudy');
  const course = watch('course');

  const passwordScore = useMemo(() => {
    return [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [password]);

  const passwordStrength =
    passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Medium' : 'Strong';

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchColleges(collegeKeyword.trim());
        setCollegeOptions(results);
      } catch {
        setCollegeOptions([]);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [collegeKeyword]);

  async function goNext() {
    setServerMessage('');
    const isValid = await trigger(stepFields[step]);
    if (!isValid) {
      return;
    }

    if (step === 0) {
      await validateStepOne();
      return;
    }

    if (step === 2) {
      await submitPendingSignup();
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  async function validateStepOne() {
    setIsSubmittingStep(true);
    try {
      const email = watch('collegeEmail');
      if (!selectedCollege) {
        setError('collegeName', { message: 'Please select your college.' });
        return;
      }

      if (
        !email
          .toLowerCase()
          .endsWith(`@${selectedCollege.emailDomain.toLowerCase()}`)
      ) {
        setError('collegeEmail', {
          message: `You selected ${selectedCollege.name}. Please use an email ending with @${selectedCollege.emailDomain}.`,
        });
        return;
      }

      const available = await checkEmailAvailability(email);
      if (!available) {
        setError('collegeEmail', {
          message: 'This email is already registered.',
        });
        return;
      }

      setStep(1);
    } catch (error) {
      setServerMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmittingStep(false);
    }
  }

  async function submitPendingSignup() {
    setIsSubmittingStep(true);
    try {
      const values = watch();
      const fullPhoneNumber = `${values.countryCode}${values.phoneNumber}`;
      const phoneAvailable = await checkPhoneAvailability(fullPhoneNumber);

      if (!phoneAvailable) {
        setError('phoneNumber', {
          message: 'This phone number is already registered.',
        });
        return;
      }

      const response = await startSignup({
        fullName: values.fullName,
        collegeId: values.collegeId,
        collegeEmail: values.collegeEmail,
        password: values.password,
        confirmPassword: values.confirmPassword,
        department: values.department,
        customDepartment: values.customDepartment,
        yearOfStudy: values.yearOfStudy,
        customYearOfStudy: values.customYearOfStudy,
        rollNumber: values.rollNumber,
        course: values.course,
        customCourse: values.customCourse,
        phoneNumber: fullPhoneNumber,
        hostelOrCampusArea: values.hostelOrCampusArea,
        profilePhotoFileName: values.profilePhotoFileName,
      });

      setUserId(response.userId);
      setDevCodes({
        emailOtp: response.devOtpCodes?.emailOtp,
        phoneOtp: response.devOtpCodes?.phoneOtp,
      });
      setStep(3);
    } catch (error) {
      setServerMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmittingStep(false);
    }
  }

  async function verifyAccount(values: SignupFormValues) {
    if (!userId) {
      setServerMessage('Please complete campus details before verification.');
      return;
    }

    setIsSubmittingStep(true);
    setServerMessage('');
    try {
      const response = await verifySignupOtp(
        userId,
        values.emailOtp ?? '',
        values.phoneOtp ?? '',
      );
      setSuccessTrustScore(response.trustScore);
    } catch (error) {
      setServerMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmittingStep(false);
    }
  }

  async function handleResend(channel: 'email' | 'phone') {
    if (!userId) {
      return;
    }

    setServerMessage('');
    try {
      const response =
        channel === 'email'
          ? await resendEmailOtp(userId)
          : await resendPhoneOtp(userId);
      setDevCodes((current) => ({
        ...current,
        [channel === 'email' ? 'emailOtp' : 'phoneOtp']:
          response.devOtp ?? undefined,
      }));
    } catch (error) {
      setServerMessage(getApiErrorMessage(error));
    }
  }

  function selectCollege(college: CollegeSummary) {
    setSelectedCollege(college);
    setCollegeKeyword(college.name);
    setValue('collegeId', college.id, { shouldValidate: true });
    setValue('collegeName', college.name, { shouldValidate: true });
  }

  function handleProfilePhoto(file: File | undefined) {
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('profilePhotoFileName', {
        message: 'Only image files are allowed.',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('profilePhotoFileName', {
        message: 'Profile photo size should be less than 2 MB.',
      });
      return;
    }

    setValue('profilePhotoFileName', file.name, { shouldValidate: true });
  }

  if (successTrustScore !== null) {
    return (
      <SignupShell step={3}>
        <section className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-[#031635]">
            Account created successfully
          </h1>
          <p className="mt-3 text-slate-600">
            Welcome to Campus Hub. Your college email and phone number are
            verified.
          </p>
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            Initial Campus Trust Score:{' '}
            <span className="font-semibold">{successTrustScore}/100</span>
          </div>
          <Link
            className="mt-8 inline-flex rounded-lg bg-[#031635] px-5 py-3 text-sm font-semibold text-white"
            to="/login"
          >
            Continue to login
          </Link>
        </section>
      </SignupShell>
    );
  }

  return (
    <SignupShell step={step}>
      <form onSubmit={handleSubmit(verifyAccount)} className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00677f]">
            Step {step + 1}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#031635] md:text-4xl">
            {step === 0 && 'Create your student account'}
            {step === 1 && 'Academic Details'}
            {step === 2 && 'Campus & Contact Details'}
            {step === 3 && 'Verify your account'}
          </h1>
          <p className="mt-3 text-slate-600">
            {step === 0 &&
              'Use your verified college identity to enter your campus marketplace.'}
            {step === 1 &&
              'Help us verify your student status to access the marketplace.'}
            {step === 2 &&
              'Almost there. Add contact details for secure account verification.'}
            {step === 3 &&
              'Enter the authentication codes sent to complete your secure registration.'}
          </p>
        </div>

        <ProgressStepper step={step} />

        {serverMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverMessage}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <TextField
              label="Full Name"
              placeholder="Enter your full name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <div className="relative space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                College Name
              </label>
              <input
                className={fieldClass(Boolean(errors.collegeName))}
                placeholder="Search your college..."
                value={collegeKeyword}
                onChange={(event) => {
                  setCollegeKeyword(event.target.value);
                  setSelectedCollege(null);
                  setValue('collegeName', '');
                  setValue('collegeId', 0);
                }}
              />
              <input type="hidden" {...register('collegeName')} />
              <input
                type="hidden"
                {...register('collegeId', { valueAsNumber: true })}
              />
              {collegeKeyword &&
                !selectedCollege &&
                collegeOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {collegeOptions.map((college) => (
                      <button
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-cyan-50"
                        key={college.id}
                        onClick={() => selectCollege(college)}
                        type="button"
                      >
                        <span className="font-medium text-slate-900">
                          {college.name}
                        </span>
                        <span className="text-slate-500">
                          @{college.emailDomain}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              <ErrorText message={errors.collegeName?.message} />
            </div>

            <TextField
              label="College Email"
              placeholder="Enter your official college email"
              type="email"
              hint={
                selectedCollege
                  ? `Must end with @${selectedCollege.emailDomain}`
                  : 'Select your college first.'
              }
              error={errors.collegeEmail?.message}
              {...register('collegeEmail')}
            />

            <PasswordField
              label="Password"
              placeholder="Create a strong password"
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrength score={passwordScore} label={passwordStrength} />

            <PasswordField
              label="Confirm Password"
              placeholder="Repeat your password"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <SelectField
              label="Department / Branch *"
              error={errors.department?.message}
              {...register('department')}
            >
              <option value="">Select your department</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            {department === 'Other' && (
              <TextField
                label="Custom Department"
                placeholder="Enter your department / branch"
                error={errors.customDepartment?.message}
                {...register('customDepartment')}
              />
            )}

            <SelectField
              label="Course *"
              error={errors.course?.message}
              {...register('course')}
            >
              <option value="">Select your course</option>
              {courses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            {course === 'Other' && (
              <TextField
                label="Custom Course"
                placeholder="Enter your course"
                error={errors.customCourse?.message}
                {...register('customCourse')}
              />
            )}

            <SelectField
              label="Year of Study *"
              error={errors.yearOfStudy?.message}
              {...register('yearOfStudy')}
            >
              <option value="">Select year</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            {yearOfStudy === 'Other' && (
              <TextField
                label="Custom Year / Status"
                placeholder="Enter your year/status"
                error={errors.customYearOfStudy?.message}
                {...register('customYearOfStudy')}
              />
            )}

            <TextField
              label="Roll / Enrollment Number"
              placeholder="e.g. EN12345678"
              hint="Optional"
              error={errors.rollNumber?.message}
              {...register('rollNumber')}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Phone Number
              </label>
              <div className="flex">
                <select
                  className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-900 focus:border-[#00677f] focus:outline-none focus:ring-1 focus:ring-[#00677f]"
                  {...register('countryCode')}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  className={`${fieldClass(Boolean(errors.phoneNumber))} rounded-l-none`}
                  placeholder="9876543210"
                  type="tel"
                  {...register('phoneNumber')}
                />
              </div>
              <ErrorText message={errors.phoneNumber?.message} />
            </div>

            <TextField
              label="Hostel / Campus Area"
              placeholder="Enter your hostel / campus area"
              error={errors.hostelOrCampusArea?.message}
              {...register('hostelOrCampusArea')}
            />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Profile Photo
              </label>
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center hover:border-[#00677f]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl text-[#031635]">
                  ↑
                </span>
                <span className="mt-4 font-semibold text-slate-900">
                  Click to upload or drag and drop
                </span>
                <span className="mt-1 text-sm text-slate-500">
                  JPG, JPEG, PNG or WEBP (max. 2 MB)
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  type="file"
                  onChange={(event) =>
                    handleProfilePhoto(event.target.files?.[0])
                  }
                />
              </label>
              {watch('profilePhotoFileName') && (
                <p className="text-sm text-slate-600">
                  Selected: {watch('profilePhotoFileName')}
                </p>
              )}
              <ErrorText message={errors.profilePhotoFileName?.message} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <OtpCard
              title="College Email"
              subtitle="OTP sent to your college email"
              devCode={devCodes.emailOtp}
              error={errors.emailOtp?.message}
              onResend={() => void handleResend('email')}
              {...register('emailOtp')}
            />
            <OtpCard
              title="Phone Number"
              subtitle="OTP sent to your phone number"
              devCode={devCodes.phoneOtp}
              error={errors.phoneOtp?.message}
              onResend={() => void handleResend('phone')}
              {...register('phoneOtp')}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-[#031635] disabled:invisible"
            disabled={step === 0 || isSubmittingStep}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            type="button"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              className="rounded-lg bg-[#031635] px-6 py-3 text-sm font-semibold text-white disabled:bg-slate-400"
              disabled={isSubmittingStep}
              onClick={() => void goNext()}
              type="button"
            >
              {isSubmittingStep
                ? 'Checking...'
                : step === 0
                  ? 'Continue to Academic'
                  : step === 1
                    ? 'Next Step'
                    : 'Continue to Verification'}
            </button>
          ) : (
            <button
              className="rounded-lg bg-[#031635] px-6 py-3 text-sm font-semibold text-white disabled:bg-slate-400"
              disabled={isSubmittingStep}
              type="submit"
            >
              {isSubmittingStep
                ? 'Verifying...'
                : 'Verify Account & Create Account'}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-semibold text-[#00677f]" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </SignupShell>
  );
}

function SignupShell({
  children,
  step,
}: {
  children: ReactNode;
  step: number;
}) {
  const messages = [
    {
      title: 'Campus Hub',
      copy: 'Buy, sell, and discover useful items within your verified college community.',
      foot: 'Secure. Student-only. Campus-focused.',
    },
    {
      title: 'Build Your Academic Profile',
      copy: 'Provide your academic details to ensure a trusted marketplace experience tailored to your campus.',
      foot: 'Secure validation. Student only.',
    },
    {
      title: 'Secure your spot in the campus network.',
      copy: 'Join a verified marketplace designed exclusively for students. Connect, trade, and thrive safely.',
      foot: 'Campus identity stays protected.',
    },
    {
      title: 'Secure. Verified. Exclusive.',
      copy: 'Complete verification and unlock your student-only marketplace account.',
      foot: 'Email + phone verification.',
    },
  ];
  const message = messages[step];

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthShowcase
          copy={message.copy}
          foot={message.foot}
          title={message.title}
          tone={step === 0 ? 'light' : 'dark'}
        />

        <section className="flex min-h-screen items-center px-4 py-8 sm:px-8 lg:px-16">
          <div className="mx-auto w-full max-w-xl">{children}</div>
        </section>
      </div>
    </main>
  );
}

function ProgressStepper({ step }: { step: number }) {
  return (
    <div className="relative">
      <div className="absolute left-0 top-4 h-0.5 w-full bg-slate-200" />
      <div className="relative flex justify-between">
        {stepLabels.map((label, index) => {
          const complete = index < step;
          const active = index === step;
          return (
            <div
              className="flex flex-col items-center gap-2 bg-[#f8f9ff] px-2"
              key={label}
            >
              <div
                className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  complete
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : active
                      ? 'border-cyan-400 bg-cyan-400 text-white'
                      : 'border-slate-300 bg-white text-slate-500'
                }`}
              >
                {complete ? '✓' : index + 1}
              </div>
              <span className="hidden text-xs font-semibold text-slate-600 sm:block">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-1 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-[#00677f] focus:ring-[#00677f]'
  }`;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

const TextField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, ...props }, ref) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        {hint && <span className="text-sm text-slate-500">{hint}</span>}
      </div>
      <input className={fieldClass(Boolean(error))} ref={ref} {...props} />
      <ErrorText message={error} />
    </div>
  ),
);
TextField.displayName = 'TextField';

type PasswordFieldProps = FieldProps & {
  visible: boolean;
  onToggle: () => void;
};

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, visible, onToggle, ...props }, ref) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <div className="relative">
        <input
          className={`${fieldClass(Boolean(error))} pr-14`}
          ref={ref}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500"
          onClick={onToggle}
          type="button"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <ErrorText message={error} />
    </div>
  ),
);
PasswordField.displayName = 'PasswordField';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, children, ...props }, ref) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <select className={fieldClass(Boolean(error))} ref={ref} {...props}>
        {children}
      </select>
      <ErrorText message={error} />
    </div>
  ),
);
SelectField.displayName = 'SelectField';

function PasswordStrength({ score, label }: { score: number; label: string }) {
  const active =
    score >= 5 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((segment) => (
          <div
            className={`h-1.5 flex-1 rounded-full ${segment <= Math.min(score, 4) ? active : 'bg-slate-200'}`}
            key={segment}
          />
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Password strength: {label}
      </p>
    </div>
  );
}

type OtpCardProps = InputHTMLAttributes<HTMLInputElement> & {
  title: string;
  subtitle: string;
  devCode?: string;
  error?: string;
  onResend: () => void;
};

const OtpCard = forwardRef<HTMLInputElement, OtpCardProps>(
  ({ title, subtitle, devCode, error, onResend, ...props }, ref) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-l-4 border-cyan-400 pl-4">
        <h2 className="text-xl font-bold text-[#031635]">{title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
      <input
        className={`${fieldClass(Boolean(error))} text-center text-2xl font-bold tracking-[0.5em]`}
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        ref={ref}
        {...props}
      />
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-500">
          {devCode ? `Dev OTP: ${devCode}` : "Didn't receive it?"}
        </span>
        <button
          className="font-semibold text-[#00677f]"
          onClick={onResend}
          type="button"
        >
          Resend code
        </button>
      </div>
      <ErrorText message={error} />
    </div>
  ),
);
OtpCard.displayName = 'OtpCard';

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}
