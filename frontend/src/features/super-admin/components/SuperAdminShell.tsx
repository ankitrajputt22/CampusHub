import {
  Activity,
  Bell,
  Building2,
  ChevronDown,
  FolderTree,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
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
  hasSuperAdminSession,
} from '../../student/lib/session';

const links = [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Manage Admins', to: '/super-admin/admins', icon: Users },
  { label: 'Manage Colleges', to: '/super-admin/colleges', icon: Building2 },
  {
    label: 'Manage Categories',
    to: '/super-admin/categories',
    icon: FolderTree,
  },
  { label: 'Audit Logs', to: '/super-admin/audit-logs', icon: ScrollText },
  {
    label: 'Platform Settings',
    to: '/super-admin/platform-settings',
    icon: Settings,
  },
  { label: 'System Health', to: '/super-admin/system-health', icon: Activity },
] as const;

export function SuperAdminShell() {
  const location = useLocation();
  const user = getCampusUser();

  if (!getRefreshToken()) {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/login"
      />
    );
  }

  if (!hasSuperAdminSession()) {
    return (
      <Navigate
        replace
        to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'}
      />
    );
  }

  return <SuperAdminShellFrame />;
}

function SuperAdminShellFrame() {
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
    <div className="min-h-screen bg-[#f4f6fb] text-[#09172d]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center border-b border-[#d7dfeb] bg-white px-4 shadow-sm lg:px-7">
        <button
          aria-label="Open Super Admin navigation"
          className="mr-2 rounded-lg p-2 text-[#09172d] hover:bg-[#eef4ff] md:hidden"
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          className="flex shrink-0 items-center gap-3 font-display text-lg font-extrabold text-[#09172d] sm:text-xl"
          to="/super-admin/dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Campus Hub Super Admin</span>
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          <Link
            aria-label="Open audit logs"
            className="rounded-xl p-2 text-[#334155] hover:bg-[#eef4ff]"
            to="/super-admin/audit-logs"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <div className="hidden text-right sm:block">
            <p className="max-w-44 truncate text-sm font-black text-[#09172d]">
              {user.fullName}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
              Super Admin
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fde2e7] text-xs font-black text-[#8a1230]">
            {initials(user.fullName)}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-[#687587] sm:block" />
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-[72px] z-40 flex w-72 flex-col border-r border-[#d7dfeb] bg-[#eaf0fb] transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">
              Ownership console
            </p>
            <p className="mt-1 text-sm font-bold text-[#1e3654]">
              Platform governance
            </p>
          </div>
          <button
            aria-label="Close Super Admin navigation"
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav
          aria-label="Super Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 pb-4"
        >
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${
                  isActive
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-[#30465f] hover:bg-white'
                }`
              }
              key={to}
              onClick={() => setMenuOpen(false)}
              to={to}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
          <div className="px-4 pt-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#8491a5]">
            Later
          </div>
          <span className="flex min-h-10 items-center gap-3 rounded-xl px-4 text-sm font-bold text-[#7b8797]">
            <ShieldCheck className="h-4.5 w-4.5" />
            Legal Content
          </span>
          <span className="flex min-h-10 items-center gap-3 rounded-xl px-4 text-sm font-bold text-[#7b8797]">
            <Gauge className="h-4.5 w-4.5" />
            Safety Content
          </span>
        </nav>
        <div className="space-y-3 border-t border-[#cad4e3] p-4">
          <Link
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#bdc9d9] bg-white text-sm font-bold text-[#1f3754]"
            to="/admin/dashboard"
          >
            <LifeBuoy className="h-4 w-4" />
            Normal Admin Panel
          </Link>
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#bdc9d9] bg-white text-sm font-bold text-rose-700 disabled:opacity-50"
            disabled={loggingOut}
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close Super Admin navigation overlay"
          className="fixed inset-0 z-30 bg-[#09172d]/45 md:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="min-h-screen pt-[72px] md:pl-72">
        <main className="mx-auto w-full max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
