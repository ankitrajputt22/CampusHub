import type { LegalSectionContent } from '../constants/legalContent';

export function LegalSection({
  index,
  section,
}: {
  index: number;
  section: LegalSectionContent;
}) {
  return (
    <section className="scroll-mt-8" id={section.id}>
      <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950 sm:text-2xl">
        {index + 1}. {section.title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-slate-600">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.bullets && (
          <ul className="space-y-2 pl-5">
            {section.bullets.map((bullet) => (
              <li className="list-disc pl-1 marker:text-cyan-700" key={bullet}>
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
