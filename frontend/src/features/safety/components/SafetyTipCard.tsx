import type { LucideIcon } from 'lucide-react';

export function SafetyTipCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-black text-[#071b33]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#667386]">{text}</p>
    </article>
  );
}
