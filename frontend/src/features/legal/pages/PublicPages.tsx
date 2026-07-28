import { Check, LifeBuoy, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const policies = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Prototype copy · 21 July 2026',
    introduction:
      'Campus Hub uses identity and marketplace information to operate a student-only college community. This page is draft content for product testing and must receive legal review before launch.',
    sections: [
      [
        'Information we collect',
        'Account details include your name, verified college email, phone number, academic profile, optional profile photo, and activity you create on Campus Hub. Marketplace records can include listings, orders, reviews, reports, and support conversations.',
      ],
      [
        'How verification works',
        'The college email domain is checked against the selected verified college. Email and phone OTP checks establish account eligibility and contribute to the Campus Trust Score.',
      ],
      [
        'Profile visibility',
        'Verified students may see the public parts of a seller profile, such as name, college, trust score, rating, successful deals, bio, and selected social links. Private contact and authentication information is not public.',
      ],
      [
        'Payments and security',
        'Payments will be processed by Razorpay. Campus Hub does not store card numbers, UPI PINs, or other sensitive payment credentials. Payment status is accepted only after backend verification.',
      ],
      [
        'Your choices',
        'Students can update optional profile fields, control profile visibility, change passwords, revoke sessions, and request account deactivation from their profile.',
      ],
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    updated: 'Prototype copy · 21 July 2026',
    introduction:
      'These draft terms describe the expected conduct of verified Campus Hub members. They are present for interface testing and are not final legal terms.',
    sections: [
      [
        'Eligibility and accounts',
        'You must be a verified student of a supported college, provide accurate information, protect your credentials, and use only one account unless Campus Hub approves otherwise.',
      ],
      [
        'Marketplace conduct',
        'Listings must be lawful, accurately described, owned by the seller, and suitable for a student marketplace. Prohibited, unsafe, counterfeit, or misleading items may be removed.',
      ],
      [
        'Buyer and seller responsibilities',
        'Buyers should inspect items before confirming handover. Sellers must disclose defects, respect agreed pricing, and avoid moving a platform payment outside the verified flow.',
      ],
      [
        'Trust, reviews, and moderation',
        'Reviews are limited to completed orders. Reports, disputes, trust signals, and account activity may be reviewed to protect the campus community. Accounts or listings can be restricted when rules are violated.',
      ],
      [
        'Payments and cancellations',
        'A frontend success message does not prove payment. Orders become paid only after server verification. Refund and cancellation outcomes depend on order status and the applicable policy.',
      ],
    ],
  },
  refund: {
    title: 'Refund and Cancellation Policy',
    updated: 'Prototype copy · 21 July 2026',
    introduction:
      'Campus Hub is designed around campus pickup. This draft explains the intended handling of failed payments, cancellations, and disputes.',
    sections: [
      [
        'Before payment',
        'A buyer may leave an unpaid order. Inventory can be released after the payment window expires.',
      ],
      [
        'Failed or duplicate payment',
        'Payment failures remain unpaid. Verified duplicate charges or gateway errors will be investigated using provider records and server-side payment events.',
      ],
      [
        'Cancellation',
        'Cancellation may be available before the seller confirms availability or before pickup. Restrictions can apply after a seller prepares or hands over an item.',
      ],
      [
        'Refund review',
        'Approved refunds return through the original payment route and may take the provider or bank processing period. Campus Hub does not ask for a UPI PIN to issue a refund.',
      ],
      [
        'Disputes after pickup',
        'Buyers should inspect the item before confirming handover. Misrepresentation, fraud, or safety concerns can be reported for review, but ordinary change-of-mind requests may not qualify.',
      ],
    ],
  },
  safety: {
    title: 'Safety Guidelines',
    updated: 'Keep every campus handover clear and public',
    introduction:
      'A good deal is one where both students understand the item, price, meeting point, and handover status before they leave.',
    sections: [
      [
        'Meet inside campus',
        'Choose a public, well-lit campus area such as the library entrance, academic block, cafeteria, or staffed hostel reception. Avoid isolated locations.',
      ],
      [
        'Inspect before confirming',
        'Check the item, included parts, working condition, serial details, and agreed quantity before confirming handover or completion.',
      ],
      [
        'Protect personal information',
        'Keep coordination tied to the verified listing and order context where possible. Never share passwords, OTPs, UPI PINs, card details, or unnecessary identity documents.',
      ],
      [
        'Use verified payments',
        'Complete platform payments only through the official checkout when available. Do not trust screenshots as proof of payment.',
      ],
      [
        'Report concerns early',
        'Report suspicious listings, pressure tactics, abusive messages, prohibited items, or fraud attempts. For immediate danger, contact college security or local emergency services.',
      ],
    ],
  },
};

export function PublicShell() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            className="flex items-center gap-3 font-bold text-[#071b33]"
            to="/login"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-[11px] font-black">
              CH
            </span>
            Campus Hub
          </Link>
          <nav
            aria-label="Public navigation"
            className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600"
          >
            <NavLink className="hover:text-cyan-800" to="/about">
              About
            </NavLink>
            <NavLink className="hover:text-cyan-800" to="/safety-guidelines">
              Safety
            </NavLink>
            <NavLink className="hover:text-cyan-800" to="/contact-support">
              Support
            </NavLink>
            <Link
              className="rounded-lg bg-[#071b33] px-4 py-2 font-semibold text-white"
              to="/login"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Campus Hub. Prototype policy content.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms-and-conditions">Terms</Link>
            <Link to="/refund-policy">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return <PolicyPage policy={policies.privacy} />;
}
export function TermsPage() {
  return <PolicyPage policy={policies.terms} />;
}
export function RefundPolicyPage() {
  return <PolicyPage policy={policies.refund} />;
}
export function SafetyGuidelinesPage() {
  return <PolicyPage policy={policies.safety} />;
}

export function AboutPage() {
  return (
    <div>
      <section className="border-b border-slate-200 bg-[#071b33] px-4 py-16 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
            About Campus Hub
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black sm:text-4xl">
            A verified marketplace built around college communities.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Campus Hub helps students discover useful items, sell what they no
            longer need, and arrange safer campus handovers with identity and
            trust signals.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
        <AboutCard
          icon={ShieldCheck}
          title="Verified membership"
          text="College email and phone verification establish a student-only starting point."
        />
        <AboutCard
          icon={MapPin}
          title="Campus first"
          text="The default marketplace stays connected to the student’s verified college."
        />
        <AboutCard
          icon={Check}
          title="Trust through action"
          text="Completed orders, honest reviews, and safe behavior build marketplace reputation."
        />
      </section>
    </div>
  );
}

export function ContactSupportPage() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.65fr_1.35fr]">
      <aside>
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
          <LifeBuoy aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-black text-slate-950">
          Contact support
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Tell us what happened and include the relevant order, listing, or
          report number when available.
        </p>
        {supportEmail && (
          <a
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:underline"
            href={`mailto:${supportEmail}`}
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            {supportEmail}
          </a>
        )}
      </aside>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">
          Choose the right next step
        </h2>
        <div className="mt-5 grid gap-4">
          <SupportOption
            description="Use the secure recovery flow for a verified student account."
            label="Account access"
            linkLabel="Reset password"
            to="/forgot-password"
          />
          <SupportOption
            description="Open the listing and use Report listing. The backend records the report against your authenticated account."
            label="Unsafe or misleading listing"
          />
          <SupportOption
            description="Keep the Campus Hub order number and Razorpay payment reference available when contacting the configured support inbox."
            label="Order or payment issue"
          />
        </div>
        {supportEmail ? (
          <a
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#071b33] px-5 text-sm font-semibold text-white"
            href={`mailto:${supportEmail}?subject=Campus%20Hub%20support%20request`}
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            Email support
          </a>
        ) : (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            An external support inbox is not configured for this environment.
            Set <code className="font-mono">VITE_SUPPORT_EMAIL</code> before
            building the frontend to enable direct support email.
          </p>
        )}
      </section>
    </div>
  );
}

function SupportOption({
  label,
  description,
  linkLabel,
  to,
}: {
  label: string;
  description: string;
  linkLabel?: string;
  to?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-slate-950">{label}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      {linkLabel && to && (
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-cyan-800 hover:underline"
          to={to}
        >
          {linkLabel}
        </Link>
      )}
    </article>
  );
}

function PolicyPage({
  policy,
}: {
  policy: {
    title: string;
    updated: string;
    introduction: string;
    sections: string[][];
  };
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[260px_1fr]">
      <aside>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
          Campus Hub policies
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">
          {policy.title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">{policy.updated}</p>
        <nav
          className="mt-8 hidden space-y-2 lg:block"
          aria-label={`${policy.title} sections`}
        >
          {policy.sections.map(([title], index) => (
            <a
              className="block border-l-2 border-slate-200 py-1 pl-3 text-sm text-slate-600 hover:border-cyan-600 hover:text-cyan-800"
              href={`#section-${index}`}
              key={title}
            >
              {title}
            </a>
          ))}
        </nav>
      </aside>
      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-base leading-8 text-slate-700">
          {policy.introduction}
        </p>
        <div className="mt-8 space-y-8">
          {policy.sections.map(([title, body], index) => (
            <section id={`section-${index}`} key={title}>
              <h2 className="text-lg font-bold text-slate-950">
                {index + 1}. {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
function AboutCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
