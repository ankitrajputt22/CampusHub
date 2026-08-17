import { Headphones, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import {
  LEGAL_LAST_UPDATED,
  type LegalDocumentContent,
} from '../constants/legalContent';
import { LegalSection } from './LegalSection';
import { LegalTableOfContents } from './LegalTableOfContents';

export function LegalPageLayout({
  document,
  updated = LEGAL_LAST_UPDATED,
}: {
  document: LegalDocumentContent;
  updated?: string;
}) {
  useLegalMetadata(document.title, document.metaDescription);

  return (
    <div>
      <section className="border-b border-slate-200 bg-[#071b33] px-4 py-12 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Campus Hub policies
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            {document.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            {document.subtitle}
          </p>
          <p className="mt-5 text-sm font-bold text-cyan-100">
            Last updated: {updated}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-12">
        <aside className="self-start lg:sticky lg:top-6">
          <LegalTableOfContents sections={document.sections} />
        </aside>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <LegalTableOfContents compact sections={document.sections} />
          <div className="mt-8 space-y-10 lg:mt-0 lg:space-y-12">
            {document.sections.map((section, index) => (
              <LegalSection index={index} key={section.id} section={section} />
            ))}
          </div>

          <aside className="mt-12 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                <Headphones aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-cyan-950">Need help?</h2>
                <p className="mt-1 text-sm leading-6 text-cyan-900">
                  Contact Campus Hub Support for questions about this policy or
                  an account, order, payment, or marketplace concern.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    className="rounded-lg bg-[#071b33] px-4 py-2.5 text-sm font-bold text-white"
                    to="/contact-support"
                  >
                    Public support
                  </Link>
                  <Link
                    className="rounded-lg border border-cyan-300 bg-white px-4 py-2.5 text-sm font-bold text-cyan-950"
                    to="/student/support"
                  >
                    My support tickets
                  </Link>
                  <Link
                    className="rounded-lg border border-cyan-300 bg-white px-4 py-2.5 text-sm font-bold text-cyan-950"
                    to="/safety-guidelines"
                  >
                    Safety Guidelines
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}

function useLegalMetadata(title: string, description: string) {
  useEffect(() => {
    const previousTitle = window.document.title;
    const pageTitle = `${title} | Campus Hub`;
    window.document.title = pageTitle;

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
    meta.content = description;

    return () => {
      window.document.title = previousTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = previousDescription;
    };
  }, [description, title]);
}
