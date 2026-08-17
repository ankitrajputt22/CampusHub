import { Link } from 'react-router-dom';

import type { SafetySectionContent } from '../constants/safetyGuidelinesContent';
import { SafetyWarningBox } from './SafetyWarningBox';

export function SafetySection({
  index,
  section,
}: {
  index: number;
  section: SafetySectionContent;
}) {
  return (
    <section className="scroll-mt-8" id={section.id}>
      <h2 className="text-xl font-black tracking-[-0.02em] text-[#071b33] sm:text-2xl">
        {index + 1}. {section.title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-[#5b697b]">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.bullets && <SafetyBullets bullets={section.bullets} />}
      </div>

      {section.groups && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {section.groups.map((group) => (
            <div
              className="rounded-xl border border-[#dce2eb] bg-[#f8fafc] p-4"
              key={group.title}
            >
              <h3 className="text-sm font-black text-[#263a52]">
                {group.title}
              </h3>
              <SafetyBullets bullets={group.bullets} compact />
            </div>
          ))}
        </div>
      )}

      {section.warning && <SafetyWarningBox warning={section.warning} />}

      {section.links && (
        <nav
          aria-label={`${section.title} resources`}
          className="mt-5 flex flex-wrap gap-3"
        >
          {section.links.map((link) => (
            <Link
              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-black text-[#00677f] hover:border-cyan-400"
              key={link.to}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}

function SafetyBullets({
  bullets,
  compact = false,
}: {
  bullets: string[];
  compact?: boolean;
}) {
  return (
    <ul
      className={`${compact ? 'mt-3 text-sm leading-6 text-[#667386]' : 'space-y-2 pl-5'} space-y-2`}
    >
      {bullets.map((bullet) => (
        <li
          className={
            compact ? 'flex gap-2' : 'list-disc pl-1 marker:text-cyan-700'
          }
          key={bullet}
        >
          {compact && (
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600"
            />
          )}
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}
