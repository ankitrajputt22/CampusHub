import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { StudentShell } from '../features/student/components/StudentShell';
import { App } from './App';

describe('Campus Hub routing shell', () => {
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
      screen.getByRole('link', { name: 'My College' }),
    ).toBeInTheDocument();
  });
});
