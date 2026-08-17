import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryRouter,
  MemoryRouter,
} from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PublicShell } from './PublicPages';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { RefundPolicyPage } from './RefundPolicyPage';
import { TermsAndConditionsPage } from './TermsAndConditionsPage';

describe('Phase 19 legal pages', () => {
  it.each([
    {
      Page: PrivacyPolicyPage,
      title: 'Privacy Policy',
      section: 'Information We Collect',
    },
    {
      Page: TermsAndConditionsPage,
      title: 'Terms and Conditions',
      section: 'Seller Responsibilities',
    },
    {
      Page: RefundPolicyPage,
      title: 'Refund Policy',
      section: 'When Refunds May Be Considered',
    },
  ])(
    'renders the public $title content and metadata',
    ({ Page, title, section }) => {
      const { unmount } = render(
        <MemoryRouter>
          <Page />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
      expect(
        screen.getByText('Last updated: 08 August 2026'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: new RegExp(section) }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('navigation', { name: 'Table of contents' }),
      ).toHaveLength(2);
      expect(window.document.title).toBe(`${title} | Campus Hub`);

      unmount();
    },
  );

  it('provides the required public header, support, signup, and footer links', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <PublicShell />,
          children: [
            { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
          ],
        },
      ],
      { initialEntries: ['/privacy-policy'] },
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole('link', { name: 'Campus Hub home' }),
    ).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/signup',
    );
    expect(
      screen.getAllByRole('link', { name: 'Contact Support' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Refund Policy' })).toHaveAttribute(
      'href',
      '/refund-policy',
    );
    expect(
      screen.getAllByRole('link', { name: 'Safety Guidelines' }).length,
    ).toBeGreaterThan(0);
  });
});
