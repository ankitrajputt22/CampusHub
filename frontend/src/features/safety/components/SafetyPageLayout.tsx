import { BadgeCheck, CreditCard, Flag, MapPinCheck } from 'lucide-react';
import { useEffect } from 'react';

import { safetyGuidelinesSections } from '../constants/safetyGuidelinesContent';
import { SafetyCTA } from './SafetyCTA';
import { SafetyHeader } from './SafetyHeader';
import { SafetySection } from './SafetySection';
import { SafetyTableOfContents } from './SafetyTableOfContents';
import { SafetyTipCard } from './SafetyTipCard';

const tips = [
  {
    icon: BadgeCheck,
    title: 'Protect your account',
    text: 'Use a strong password and never share passwords or OTPs—even with someone claiming to be support.',
  },
  {
    icon: CreditCard,
    title: 'Verify payments',
    text: 'Trust the backend-verified payment status, not screenshots, messages, or a browser success screen alone.',
  },
  {
    icon: MapPinCheck,
    title: 'Meet in public',
    text: 'Choose a well-lit campus common area, inspect the item, and leave if a pickup feels unsafe.',
  },
  {
    icon: Flag,
    title: 'Report concerns early',
    text: 'Report fake listings, scams, prohibited items, harassment, unsafe pickup behavior, and payment issues.',
  },
];

export function SafetyPageLayout() {
  useSafetyMetadata();

  return (
    <div>
      <SafetyHeader />

      <section
        aria-label="Quick safety tips"
        className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
      >
        {tips.map((tip) => (
          <SafetyTipCard key={tip.title} {...tip} />
        ))}
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-6">
          <SafetyTableOfContents sections={safetyGuidelinesSections} />
        </aside>

        <article className="min-w-0 rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <SafetyTableOfContents compact sections={safetyGuidelinesSections} />
          <div className="mt-8 space-y-10 lg:mt-0 lg:space-y-12">
            {safetyGuidelinesSections.map((section, index) => (
              <SafetySection index={index} key={section.id} section={section} />
            ))}
          </div>
          <SafetyCTA />
        </article>
      </div>
    </div>
  );
}

function useSafetyMetadata() {
  useEffect(() => {
    const previousTitle = window.document.title;
    window.document.title = 'Safety Guidelines | Campus Hub';

    let meta = window.document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const created = !meta;
    const previousDescription = meta?.content ?? '';
    if (!meta) {
      meta = window.document.createElement('meta');
      meta.name = 'description';
      window.document.head.append(meta);
    }
    meta.content =
      'Learn how to buy, sell, pay, meet, and report safely on Campus Hub.';

    return () => {
      window.document.title = previousTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = previousDescription;
    };
  }, []);
}
