import campusMarketplaceVisual from '../../../assets/campus-marketplace-visual.svg';

type AuthShowcaseProps = {
  title: string;
  copy: string;
  foot: string;
  tone?: 'light' | 'dark';
};

export function AuthShowcase({
  title,
  copy,
  foot,
  tone = 'dark',
}: AuthShowcaseProps) {
  const light = tone === 'light';

  return (
    <aside
      className={`hidden min-h-screen flex-col justify-between overflow-hidden p-10 lg:flex ${
        light ? 'bg-[#eff4ff] text-[#031635]' : 'bg-[#102544] text-white'
      }`}
    >
      <div className="flex items-center gap-3 text-2xl font-bold">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            light ? 'bg-[#031635] text-white' : 'bg-white text-[#031635]'
          }`}
        >
          CH
        </span>
        <span>Campus Hub</span>
      </div>

      <div className="max-w-xl">
        <h2 className="text-5xl font-bold leading-tight">{title}</h2>
        <p
          className={`mt-6 text-xl leading-8 ${
            light ? 'text-slate-600' : 'text-blue-100'
          }`}
        >
          {copy}
        </p>

        <div
          className={`mt-10 overflow-hidden rounded-2xl border p-4 shadow-2xl ${
            light ? 'border-white/80 bg-white' : 'border-white/15 bg-white/10'
          }`}
        >
          <div
            className={`overflow-hidden rounded-xl ${
              light ? 'bg-white' : 'bg-[#071b34]'
            }`}
          >
            <img
              alt="Students using Campus Hub marketplace on campus"
              className="block aspect-[4/3] h-auto w-full object-contain"
              src={campusMarketplaceVisual}
            />
          </div>
        </div>
      </div>

      <p
        className={`text-sm font-semibold uppercase tracking-[0.22em] ${
          light ? 'text-[#00677f]' : 'text-cyan-200'
        }`}
      >
        {foot}
      </p>
    </aside>
  );
}
