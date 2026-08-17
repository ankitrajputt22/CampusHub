import { LegalPageLayout } from '../components/LegalPageLayout';
import { privacyPolicy } from '../constants/legalContent';

export function PrivacyPolicyPage() {
  return <LegalPageLayout document={privacyPolicy} />;
}
