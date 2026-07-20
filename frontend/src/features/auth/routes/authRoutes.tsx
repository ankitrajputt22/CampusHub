import type { RouteObject } from 'react-router-dom';

import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { OtpVerificationPage } from '../pages/OtpVerificationPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { SignupPage } from '../pages/SignupPage';

export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    path: 'signup',
    element: <SignupPage />,
  },
  {
    path: 'verify-otp',
    element: <OtpVerificationPage />,
  },
  {
    path: 'forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: 'reset-password',
    element: <ResetPasswordPage />,
  },
];
