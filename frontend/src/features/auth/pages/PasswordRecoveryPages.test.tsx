import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordReset,
} from '../api/authApi';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { OtpVerificationPage } from './OtpVerificationPage';
import { ResetPasswordPage } from './ResetPasswordPage';

vi.mock('../api/authApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/authApi')>();
  return {
    ...original,
    completePasswordReset: vi.fn(),
    requestPasswordReset: vi.fn(),
    verifyPasswordReset: vi.fn(),
  };
});

describe('password recovery pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.mocked(requestPasswordReset).mockResolvedValue({
      requestId: 'request-123',
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
      devOtp: '241011',
    });
    vi.mocked(verifyPasswordReset).mockResolvedValue({
      requestId: 'request-123',
      resetToken: 'single-use-reset-token',
      expiresInSeconds: 600,
    });
    vi.mocked(completePasswordReset).mockResolvedValue(undefined);
  });

  it('completes the request, OTP, and one-use password reset flow', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route element={<ForgotPasswordPage />} path="/forgot-password" />
          <Route element={<OtpVerificationPage />} path="/verify-otp" />
          <Route element={<ResetPasswordPage />} path="/reset-password" />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText('College email'),
      'Ankit241011@RECMainpuri.in',
    );
    await user.click(
      screen.getByRole('button', { name: 'Send recovery code' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Verify recovery code' }),
    ).toBeInTheDocument();
    expect(screen.getByText('241011')).toBeInTheDocument();
    expect(requestPasswordReset).toHaveBeenCalledWith(
      'Ankit241011@RECMainpuri.in',
    );

    await user.type(screen.getByLabelText('Six-digit recovery code'), '241011');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    expect(
      await screen.findByRole('heading', { name: 'Reset password' }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('New password'), 'Recovered@456');
    await user.type(screen.getByLabelText('Confirm password'), 'Recovered@456');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() =>
      expect(completePasswordReset).toHaveBeenCalledWith({
        requestId: 'request-123',
        resetToken: 'single-use-reset-token',
        newPassword: 'Recovered@456',
        confirmPassword: 'Recovered@456',
      }),
    );
    expect(
      await screen.findByText('Password updated successfully'),
    ).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });
});
