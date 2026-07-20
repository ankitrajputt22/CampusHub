import { apiClient } from '../../../lib/apiClient';

export type CollegeSummary = {
  id: number;
  name: string;
  code: string;
  emailDomain: string;
};

export type SignupStartPayload = {
  fullName: string;
  collegeId: number;
  collegeEmail: string;
  password: string;
  confirmPassword: string;
  department: string;
  customDepartment?: string;
  yearOfStudy: string;
  customYearOfStudy?: string;
  rollNumber?: string;
  course: string;
  customCourse?: string;
  phoneNumber: string;
  hostelOrCampusArea: string;
  profilePhotoFileName?: string;
};

export type SignupStartResponse = {
  userId: number;
  accountStatus: string;
  otpExpiresInSeconds: number;
  resendAfterSeconds: number;
  devOtpCodes: {
    emailOtp: string;
    phoneOtp: string;
  } | null;
};

export type OtpSendResponse = {
  userId: number;
  channel: 'EMAIL' | 'PHONE';
  expiresInSeconds: number;
  resendAfterSeconds: number;
  devOtp: string | null;
};

export type SignupVerifyResponse = {
  userId: number;
  accountStatus: string;
  trustScore: number;
};

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  collegeId: number;
  collegeName: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  accountStatus: string;
  trustScore: number;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export async function searchColleges(keyword: string) {
  const response = await apiClient.get<ApiResponse<CollegeSummary[]>>(
    '/colleges/search',
    {
      params: { keyword },
    },
  );
  return response.data.data;
}

export async function checkEmailAvailability(email: string) {
  const response = await apiClient.post<ApiResponse<{ available: boolean }>>(
    '/auth/check-email',
    {
      value: email,
    },
  );
  return response.data.data.available;
}

export async function checkPhoneAvailability(phoneNumber: string) {
  const response = await apiClient.post<ApiResponse<{ available: boolean }>>(
    '/auth/check-phone',
    {
      value: phoneNumber,
    },
  );
  return response.data.data.available;
}

export async function startSignup(payload: SignupStartPayload) {
  const response = await apiClient.post<ApiResponse<SignupStartResponse>>(
    '/auth/signup/start',
    payload,
  );
  return response.data.data;
}

export async function resendEmailOtp(userId: number) {
  const response = await apiClient.post<ApiResponse<OtpSendResponse>>(
    '/auth/send-email-otp',
    {
      userId,
    },
  );
  return response.data.data;
}

export async function resendPhoneOtp(userId: number) {
  const response = await apiClient.post<ApiResponse<OtpSendResponse>>(
    '/auth/send-phone-otp',
    {
      userId,
    },
  );
  return response.data.data;
}

export async function verifySignupOtp(
  userId: number,
  emailOtp: string,
  phoneOtp: string,
) {
  const response = await apiClient.post<ApiResponse<SignupVerifyResponse>>(
    '/auth/verify-signup-otp',
    {
      userId,
      emailOtp,
      phoneOtp,
    },
  );
  return response.data.data;
}

export async function login(payload: {
  email: string;
  password: string;
  rememberMe: boolean;
}) {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    payload,
  );
  return response.data.data;
}

export function getApiErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data as {
      message?: string;
      data?: Record<string, string>;
    };
    if (data.data && typeof data.data === 'object') {
      return (
        Object.values(data.data)[0] ??
        data.message ??
        'Please check the form details.'
      );
    }
    return data.message ?? 'Something went wrong.';
  }

  return 'Unable to reach Campus Hub backend. Please make sure it is running.';
}
