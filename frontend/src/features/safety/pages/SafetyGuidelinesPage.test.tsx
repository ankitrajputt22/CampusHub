import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { safetyGuidelinesSections } from '../constants/safetyGuidelinesContent';
import { SafetyGuidelinesPage } from './SafetyGuidelinesPage';

describe('SafetyGuidelinesPage', () => {
  it('renders the complete public safety guidance and support actions', () => {
    render(
      <MemoryRouter>
        <SafetyGuidelinesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Safety Guidelines' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: 08 August 2026'),
    ).toBeInTheDocument();
    expect(safetyGuidelinesSections).toHaveLength(15);

    for (const section of safetyGuidelinesSections) {
      expect(
        screen.getByRole('heading', { name: new RegExp(section.title) }),
      ).toBeInTheDocument();
    }

    expect(
      screen.getAllByRole('navigation', { name: 'Safety table of contents' }),
    ).toHaveLength(2);
    expect(
      screen.getByText(
        'Campus Hub Support will never ask for your password or OTP',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Do not wait for a support reply during an emergency'),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'Report a Problem' })
        .every((link) => link.getAttribute('href') === '/student/support/new'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'Contact Support' })
        .every((link) => link.getAttribute('href') === '/contact-support'),
    ).toBe(true);
    expect(window.document.title).toBe('Safety Guidelines | Campus Hub');
  });
});
