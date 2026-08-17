import {
  Bell,
  ChevronDown,
  CreditCard,
  FileWarning,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PackageSearch,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
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
  hasAdminSession,
} from '../../student/lib/session';

const adminLinks = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Listings', to: '/admin/listings', icon: PackageSearch },
  { label: 'Reports', to: '/admin/reports', icon: FileWarning },
  { label: 'Reviews', to: '/admin/reviews', icon: Star },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
  { label: 'Support Tickets', to: '/admin/support', icon: LifeBuoy },
] as const;

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
  const [search, setSearch] = useState('');
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

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    navigate(`/admin/users?search=${encodeURIComponent(value)}`);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0b1c30]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center border-b border-[#d6d9e2] bg-white px-4 shadow-sm lg:px-7">
        <button
          aria-label="Open admin navigation"
          className="mr-2 rounded-lg p-2 text-[#031635] hover:bg-[#eff4ff] md:hidden"
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          className="flex shrink-0 items-center gap-3 font-display text-lg font-extrabold text-[#031635] sm:text-xl"
          to="/admin/dashboard"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#031635] text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Campus Hub Admin</span>
        </Link>

        <form
          className="mx-4 hidden max-w-xl flex-1 lg:block"
          onSubmit={submitSearch}
        >
          <label className="relative block">
            <span className="sr-only">Search users</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68707d]" />
            <input
              className="h-11 w-full rounded-xl border border-[#d6d9e2] bg-[#f6f8fc] pl-11 pr-4 text-sm outline-none focus:border-cyan-700 focus:bg-white"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users by name, email, phone, or ID"
              value={search}
            />
          </label>
        </form>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <Link
            aria-label="Open pending reports"
            className="relative rounded-xl p-2 text-[#334155] hover:bg-[#eff4ff]"
            to="/admin/reports?status=PENDING"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-rose-500" />
          </Link>
          <div className="hidden text-right sm:block">
            <p className="max-w-40 truncate text-sm font-bold text-[#031635]">
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
              Control centre
            </p>
            <p className="mt-1 text-sm font-bold text-[#1e3654]">
              Platform operations
            </p>
          </div>
          <button
            aria-label="Close admin navigation"
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 pb-4"
        >
          {adminLinks.map(({ label, to, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${
                  isActive
                    ? 'bg-[#031635] text-white shadow-sm'
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
        </nav>
        <div className="border-t border-[#cad4e3] p-4">
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#bdc9d9] bg-white text-sm font-bold text-rose-700 disabled:opacity-50"
            disabled={loggingOut}
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close admin navigation overlay"
          className="fixed inset-0 z-30 bg-[#031635]/45 md:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="min-h-screen pt-[72px] md:pl-64">
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
