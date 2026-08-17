import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

import type { SafetyWarningContent } from '../constants/safetyGuidelinesContent';

export function SafetyWarningBox({
  warning,
}: {
  warning: SafetyWarningContent;
}) {
  const style = {
    caution: 'border-amber-200 bg-amber-50 text-amber-950',
    danger: 'border-rose-200 bg-rose-50 text-rose-950',
    positive: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  }[warning.tone];
  const Icon =
    warning.tone === 'danger'
      ? ShieldAlert
      : warning.tone === 'positive'
        ? CheckCircle2
        : AlertTriangle;

  return (
    <aside className={`mt-5 rounded-xl border p-4 ${style}`}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="text-sm font-black">{warning.title}</h3>
          <p className="mt-1 text-sm leading-6 opacity-90">{warning.text}</p>
        </div>
      </div>
    </aside>
  );
}
