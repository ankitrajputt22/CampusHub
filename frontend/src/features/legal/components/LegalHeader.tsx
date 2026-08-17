import { Link, NavLink } from 'react-router-dom';

export function LegalHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          aria-label="Campus Hub home"
          className="flex items-center gap-3 font-black text-[#071b33]"
          to="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-xs font-black text-[#003846]">
            CH
          </span>
          <span className="text-lg">Campus Hub</span>
        </Link>

        <nav
          aria-label="Public navigation"
          className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-bold text-slate-600"
        >
          <NavLink className="hover:text-cyan-800" to="/">
            Home
          </NavLink>
          <NavLink className="hover:text-cyan-800" to="/contact-support">
            Contact Support
          </NavLink>
          <Link className="hover:text-cyan-800" to="/login">
            Log in
          </Link>
          <Link
            className="rounded-lg bg-[#071b33] px-4 py-2.5 text-white hover:bg-[#17314f]"
            to="/signup"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
