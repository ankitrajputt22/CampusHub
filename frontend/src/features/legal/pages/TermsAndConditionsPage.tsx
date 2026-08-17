import { LegalPageLayout } from '../components/LegalPageLayout';
import { termsAndConditions } from '../constants/legalContent';

export function TermsAndConditionsPage() {
  return <LegalPageLayout document={termsAndConditions} />;
}
