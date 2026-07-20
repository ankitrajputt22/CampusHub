import { Check, LifeBuoy, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
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
        'Students can update optional profile fields, change notification preferences, and request account deactivation through settings or support.',
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
        'Use Campus Hub chat where possible. Never share passwords, OTPs, UPI PINs, card details, or unnecessary identity documents.',
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
  const [submitted, setSubmitted] = useState(false);
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
        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Mail aria-hidden="true" className="h-4 w-4 text-cyan-700" />
          support@campushub.example
        </p>
      </aside>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {submitted ? (
          <div className="py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check aria-hidden="true" className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Test request received
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              No support ticket was sent to a backend.
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input className={inputClass} required />
              </Field>
              <Field label="College email">
                <input className={inputClass} required type="email" />
              </Field>
            </div>
            <Field label="Topic">
              <select className={inputClass} defaultValue="">
                <option disabled value="">
                  Choose a topic
                </option>
                <option>Account and verification</option>
                <option>Listing or order</option>
                <option>Payment or refund</option>
                <option>Safety report</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Order or listing ID (optional)">
              <input className={inputClass} placeholder="e.g. CH-240718" />
            </Field>
            <Field label="How can we help?">
              <textarea className={`${inputClass} min-h-36 py-3`} required />
            </Field>
            <button
              className="h-11 rounded-lg bg-[#071b33] px-6 text-sm font-semibold text-white"
              type="submit"
            >
              Submit test request
            </button>
          </form>
        )}
      </section>
    </div>
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
const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100';
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      {children}
    </label>
  );
}
