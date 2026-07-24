import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StudentShell } from '../features/student/components/StudentShell';
import {
  clearCampusSession,
  saveCampusSession,
} from '../features/student/lib/session';
import { App } from './App';

vi.mock('../features/student/dashboard/api/dashboardApi', () => ({
  getStudentDashboard: vi.fn(() => new Promise(() => undefined)),
}));

describe('Campus Hub routing shell', () => {
  beforeEach(() => {
    saveCampusSession({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {
        id: 1,
        fullName: 'Ankit Rajput',
        collegeId: 1,
        collegeName: 'IIT Delhi',
        email: 'ankit@iitd.ac.in',
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        trustScore: 30,
      },
    });
  });

  afterEach(() => {
    clearCampusSession();
  });

  it('renders a student workspace route', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <App />,
        children: [
          {
            element: <StudentShell />,
            children: [{ index: true, element: <h1>Marketplace preview</h1> }],
          },
        ],
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('link', { name: /Campus Hub/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Marketplace preview' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'My College Marketplace' }),
    ).toBeInTheDocument();
  });
});
