import {
  ChevronDown,
  FileWarning,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { logout as requestLogout } from '../../auth/api/authApi';
import {
  clearCampusSession,
  getCampusUser,
  getRefreshToken,
  hasAdminSession,
} from '../../student/lib/session';

export function AdminShell() {
  const location = useLocation();

  if (!hasAdminSession()) {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/login"
      />
    );
  }

  return <AdminShellFrame />;
}

function AdminShellFrame() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const user = getCampusUser();

  useEffect(() => {
    function handleSessionExpired() {
      navigate('/login', { replace: true });
    }
    window.addEventListener('campusHub:session-expired', handleSessionExpired);
    return () =>
      window.removeEventListener(
        'campusHub:session-expired',
        handleSessionExpired,
      );
  }, [navigate]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) await requestLogout(refreshToken);
    } finally {
      clearCampusSession();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0b1c30]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center border-b border-[#d6d9e2] bg-white px-4 shadow-sm lg:px-7">
        <button
          aria-label="Open moderator navigation"
          className="mr-2 rounded-lg p-2 text-[#031635] hover:bg-[#eff4ff] md:hidden"
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          className="flex items-center gap-3 font-display text-xl font-extrabold text-[#031635]"
          to="/admin/reports"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#031635] text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          Campus Hub Moderation
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="truncate text-sm font-bold text-[#031635]">
              {user.fullName}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700">
              {user.role.replace('_', ' ')}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8e2ff] text-xs font-black text-[#081b3a]">
            {initials(user.fullName)}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-[#68707d] sm:block" />
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-[72px] z-40 flex w-64 flex-col border-r border-[#cad4e3] bg-[#eaf0fb] transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">
              Safety workspace
            </p>
            <p className="mt-1 text-sm font-bold text-[#1e3654]">
              Review and action
            </p>
          </div>
          <button
            aria-label="Close moderator navigation"
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3" aria-label="Moderator navigation">
          <NavLink
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-bold ${
                isActive
                  ? 'bg-[#031635] text-white'
                  : 'text-[#30465f] hover:bg-white'
              }`
            }
            onClick={() => setMenuOpen(false)}
            to="/admin/reports"
          >
            <FileWarning className="h-5 w-5" />
            Reports queue
          </NavLink>
        </nav>
        <div className="border-t border-[#cad4e3] p-4">
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#bdc9d9] bg-white text-sm font-bold text-rose-700 disabled:opacity-50"
            disabled={loggingOut}
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close moderator navigation overlay"
          className="fixed inset-0 z-30 bg-[#031635]/45 md:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="min-h-screen pt-[72px] md:pl-64">
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
