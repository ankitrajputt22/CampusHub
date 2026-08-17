import { LegalPageLayout } from '../components/LegalPageLayout';
import { refundPolicy } from '../constants/legalContent';

export function RefundPolicyPage() {
  return <LegalPageLayout document={refundPolicy} />;
}
