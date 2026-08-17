import { Link } from 'react-router-dom';

export function LegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Campus Hub. All rights reserved.</p>
        <nav
          aria-label="Legal and support links"
          className="flex flex-wrap gap-x-5 gap-y-2 font-semibold"
        >
          <Link className="hover:text-cyan-800" to="/privacy-policy">
            Privacy Policy
          </Link>
          <Link className="hover:text-cyan-800" to="/terms-and-conditions">
            Terms and Conditions
          </Link>
          <Link className="hover:text-cyan-800" to="/refund-policy">
            Refund Policy
          </Link>
          <Link className="hover:text-cyan-800" to="/safety-guidelines">
            Safety Guidelines
          </Link>
          <Link className="hover:text-cyan-800" to="/contact-support">
            Contact Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
