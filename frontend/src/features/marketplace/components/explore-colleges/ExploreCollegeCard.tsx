import {
  ArrowRight,
  BookOpen,
  Building2,
  MapPin,
  PackageSearch,
  Sparkles,
  Users,
} from 'lucide-react';

import type { ExploreCollege } from '../../api/exploreApi';

export function ExploreCollegeCard({
  college,
  featured = false,
  selected = false,
  onExplore,
}: {
  college: ExploreCollege;
  featured?: boolean;
  selected?: boolean;
  onExplore: (college: ExploreCollege) => void;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] transition ${
        selected
          ? 'border-cyan-600 ring-2 ring-cyan-100'
          : 'border-[#dce2eb] hover:-translate-y-0.5 hover:border-[#b9c5d4] hover:shadow-[0_10px_26px_rgba(3,22,53,0.09)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f8fc] text-[#007f9c]">
          <Building2 aria-hidden="true" className="h-6 w-6" />
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-amber-800">
              <Sparkles aria-hidden="true" className="h-3 w-3" />
              Popular
            </span>
          )}
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.09em] text-emerald-800">
            Verified
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.11em] text-[#0083a0]">
        {college.code}
      </p>
      <h3 className="mt-1 min-h-12 text-lg font-black leading-6 tracking-[-0.02em] text-[#071b33]">
        {college.name}
      </h3>
      <p className="mt-2 flex items-center gap-2 text-sm text-[#667386]">
        <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {[college.city, college.state].filter(Boolean).join(', ')}
        </span>
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <Stat
          icon={<PackageSearch className="h-4 w-4" />}
          label="Active listings"
          value={college.activeListings}
        />
        <Stat
          icon={<Users className="h-4 w-4" />}
          label="Verified students"
          value={college.verifiedStudents}
        />
      </dl>

      <div className="mt-4 min-h-14">
        {college.popularCategories.length > 0 ? (
          <>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#7a8697]">
              <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
              Popular categories
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {college.popularCategories.map((category) => (
                <span
                  className="rounded-md bg-[#f0f4fa] px-2 py-1 text-[11px] font-bold text-[#465a72]"
                  key={category}
                >
                  {category}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs leading-5 text-[#7a8697]">
            New listings from this campus will appear here.
          </p>
        )}
      </div>

      <button
        className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031635] px-4 text-sm font-bold text-white hover:bg-[#153557]"
        onClick={() => onExplore(college)}
        type="button"
      >
        {selected
          ? 'Viewing marketplace'
          : `Explore ${college.activeListings} listings`}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#f6f8fc] p-3">
      <dt className="flex items-center gap-1.5 text-[#6c7a8c]">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.07em]">
          {label}
        </span>
      </dt>
      <dd className="mt-1.5 text-xl font-black text-[#10233d]">
        {value.toLocaleString('en-IN')}
      </dd>
    </div>
  );
}
