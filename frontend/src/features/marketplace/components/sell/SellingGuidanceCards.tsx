import { ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

const sellingTips = [
  {
    title: 'Upload clear product images',
    detail: 'from different angles to build immediate trust.',
  },
  {
    title: 'Write an honest description',
    detail: 'including current condition, defects, and reason for selling.',
  },
  {
    title: 'Meet in safe campus areas',
    detail: 'such as hostel gates, libraries, or the main canteen.',
  },
];

export function SellingGuidanceCards({ category }: { category: string }) {
  const marketplaceLink = category
    ? `/student/marketplace?search=${encodeURIComponent(category)}`
    : '/student/marketplace';

  return (
    <section
      className="scroll-mt-24 rounded-2xl border border-[#cfdcf0] bg-[#eff4ff] p-5"
      id="selling-guidance"
    >
      <h2 className="flex items-center gap-2 font-black text-[#10233d]">
        <Lightbulb aria-hidden="true" className="h-5 w-5 text-[#007b95]" />
        Selling tips
      </h2>
      <ul className="mt-4 space-y-3 text-sm leading-5 text-[#5f6d80]">
        {sellingTips.map((tip) => (
          <li className="flex items-start gap-2.5" key={tip.title}>
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[#007b95]"
            />
            <span>
              <strong className="text-[#25384f]">{tip.title}</strong>{' '}
              {tip.detail}
            </span>
          </li>
        ))}
      </ul>

      <Link
        className="mt-5 flex items-center justify-between rounded-xl bg-[#1a3153] px-4 py-3 text-sm text-white transition hover:bg-[#031635]"
        rel="noreferrer"
        target="_blank"
        to={marketplaceLink}
      >
        <span>
          <strong className="block">Need pricing help?</strong>
          <span className="mt-0.5 block text-xs text-[#b9cae0]">
            Check similar campus listings
          </span>
        </span>
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
