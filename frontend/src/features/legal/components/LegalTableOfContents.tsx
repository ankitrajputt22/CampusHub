import type { LegalSectionContent } from '../constants/legalContent';

export function LegalTableOfContents({
  sections,
  compact = false,
}: {
  sections: LegalSectionContent[];
  compact?: boolean;
}) {
  return (
    <nav
      aria-label="Table of contents"
      className={
        compact
          ? 'rounded-xl border border-slate-200 bg-slate-50 p-4 lg:hidden'
          : 'hidden lg:block'
      }
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-800">
        Table of contents
      </p>
      <ol
        className={
          compact
            ? 'mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2'
            : 'mt-4 max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto pr-2'
        }
      >
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              className="block border-l-2 border-slate-200 py-1.5 pl-3 text-sm leading-5 text-slate-600 hover:border-cyan-600 hover:text-cyan-800"
              href={`#${section.id}`}
            >
              {index + 1}. {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
