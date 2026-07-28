import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  Compass,
  FileWarning,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Star,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { logout as requestLogout } from '../../auth/api/authApi';
import { NotificationBell } from '../../notifications/components/NotificationBell';
import { StudentDashboardProvider } from '../dashboard/context/StudentDashboardProvider';
import { useStudentDashboard } from '../dashboard/context/studentDashboardContext';
import {
  clearCampusSession,
  getCampusUser,
  getRefreshToken,
  hasStudentSession,
} from '../lib/session';

const primaryNav = [
  {
    label: 'Dashboard',
    shortLabel: 'Home',
    to: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My College Marketplace',
    shortLabel: 'Market',
    to: '/student/marketplace',
    icon: Store,
  },
  {
    label: 'Explore Other Colleges',
    to: '/student/explore-colleges',
    icon: Compass,
  },
  {
    label: 'My Marketplace',
    to: '/student/my-marketplace',
    icon: Package,
  },
  {
    label: 'Orders',
    shortLabel: 'Orders',
    to: '/student/orders',
    icon: ShoppingBag,
  },
  {
    label: 'Payments',
    to: '/student/payments',
    icon: CircleDollarSign,
  },
  {
    label: 'Reviews',
    to: '/student/reviews',
    icon: Star,
  },
  {
    label: 'Wishlist',
    to: '/student/wishlist',
    icon: Heart,
  },
];

const accountNav = [
  { label: 'Profile', to: '/student/profile', icon: UserRound },
  { label: 'Notifications', to: '/student/notifications', icon: Bell },
  { label: 'My Reports', to: '/student/reports', icon: FileWarning },
];

export function StudentShell() {
  const location = useLocation();

  if (!hasStudentSession()) {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/login"
      />
    );
  }

  return (
    <StudentDashboardProvider>
      <StudentShellFrame />
    </StudentDashboardProvider>
  );
}

function StudentShellFrame() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const cachedUser = getCampusUser();
  const { data } = useStudentDashboard();
  const user = data?.user ?? cachedUser;
  const trustScore = data?.trustScore.score ?? cachedUser.trustScore;
  const unreadNotifications = data?.stats.unreadNotifications ?? 0;
  const wishlistItems = data?.stats.wishlistItems ?? 0;

  useEffect(() => {
    function handleSessionExpired() {
      navigate('/login', { replace: true });
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    window.addEventListener('campusHub:session-expired', handleSessionExpired);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener(
        'campusHub:session-expired',
        handleSessionExpired,
      );
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [navigate]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = search.trim();
    navigate(
      keyword
        ? `/student/marketplace?search=${encodeURIComponent(keyword)}`
        : '/student/marketplace',
    );
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await requestLogout(refreshToken);
    } finally {
      clearCampusSession();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center border-b border-[#d6d9e2] bg-white/95 px-4 shadow-[0_1px_3px_rgba(3,22,53,0.06)] backdrop-blur lg:px-7">
        <div className="flex min-w-0 items-center gap-3 lg:w-[520px]">
          <button
            aria-label="Open navigation"
            className="rounded-lg p-2 text-[#031635] hover:bg-[#eff4ff] md:hidden"
            onClick={() => setMenuOpen(true)}
            title="Open navigation"
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          <Link
            className="shrink-0 font-display text-xl font-extrabold tracking-[-0.03em] text-[#031635] sm:text-2xl"
            to="/student/dashboard"
          >
            Campus Hub
          </Link>
          <form
            className="relative ml-1 hidden min-w-0 flex-1 sm:block"
            onSubmit={submitSearch}
          >
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#44474e]"
            />
            <input
              aria-label={`Search items in ${user.collegeName}`}
              className="h-11 w-full rounded-full border border-[#c5c6cf] bg-[#eff4ff] pl-11 pr-4 text-sm text-[#0b1c30] outline-none transition placeholder:text-[#68707d] focus:border-[#00677f] focus:bg-white focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search items in ${shortCollegeName(user.collegeName)}...`}
              type="search"
              value={search}
            />
          </form>
        </div>

        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden h-full items-center gap-8 lg:flex"
        >
          <TopNavLink label="Dashboard" to="/student/dashboard" />
          <TopNavLink label="Marketplace" to="/student/marketplace" />
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <HeaderIconLink
            badge={wishlistItems}
            icon={Heart}
            label="Wishlist"
            to="/student/wishlist"
          />
          <NotificationBell initialUnreadCount={unreadNotifications} />
          <Link
            className="hidden h-10 items-center gap-2 rounded-lg bg-[#031635] px-4 text-sm font-bold text-white hover:bg-[#1a2b4b] sm:inline-flex"
            to="/student/sell"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Sell Item
          </Link>
          <div className="relative" ref={profileMenuRef}>
            <button
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label="Open profile menu"
              className="flex h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-[#eff4ff]"
              onClick={() => setProfileMenuOpen((current) => !current)}
              type="button"
            >
              <Avatar name={user.fullName} />
              <ChevronDown
                aria-hidden="true"
                className="hidden h-4 w-4 text-[#75777f] xl:block"
              />
            </button>
            {profileMenuOpen && (
              <div
                className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-[#d6d9e2] bg-white shadow-[0_12px_30px_rgba(3,22,53,0.14)]"
                role="menu"
              >
                <div className="border-b border-[#e6e8ee] px-4 py-3">
                  <p className="truncate text-sm font-bold text-[#031635]">
                    {user.fullName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#68707d]">
                    {user.collegeName}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#00677f]">
                    Trust score {trustScore}/100
                  </p>
                </div>
                <ProfileMenuLink
                  icon={UserRound}
                  label="Profile"
                  onClick={() => setProfileMenuOpen(false)}
                  to="/student/profile"
                />
                <ProfileMenuLink
                  icon={ShieldCheck}
                  label="Privacy & security"
                  onClick={() => setProfileMenuOpen(false)}
                  to="/student/profile#profile-security"
                />
                <button
                  className="flex w-full items-center gap-3 border-t border-[#e6e8ee] px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  disabled={loggingOut}
                  onClick={() => void logout()}
                  role="menuitem"
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  {loggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-[72px] z-40 flex w-64 flex-col border-r border-[#c9d7ed] bg-[#e5eeff] transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-7">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar large name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-[#031635]">
                {firstName(user.fullName)}
              </p>
              <p className="text-xs font-medium text-[#44474e]">
                Verified Student
              </p>
            </div>
          </div>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-[#44474e] hover:bg-white/60 md:hidden"
            onClick={() => setMenuOpen(false)}
            title="Close navigation"
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Student navigation"
          className="flex-1 overflow-y-auto px-3 pb-4"
        >
          <div className="space-y-1">
            {primaryNav.map((item) => (
              <SidebarLink
                key={item.to}
                onClick={() => setMenuOpen(false)}
                {...item}
              />
            ))}
          </div>
          <div className="my-4 border-t border-[#c9d7ed]" />
          <div className="space-y-1">
            {accountNav.map((item) => (
              <SidebarLink
                key={item.to}
                onClick={() => setMenuOpen(false)}
                {...item}
              />
            ))}
          </div>
        </nav>

        <div className="p-4">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1a3153] text-sm font-bold text-white shadow-sm hover:bg-[#031635]"
            onClick={() => setMenuOpen(false)}
            to="/student/sell"
          >
            <Plus aria-hidden="true" className="h-[18px] w-[18px]" />
            List an Item
          </Link>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-[#031635]/45 md:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="min-h-screen pt-[72px] md:pl-64">
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Mobile student navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-[#d6d9e2] bg-white md:hidden"
      >
        <MobileNavLink
          icon={LayoutDashboard}
          label="Home"
          to="/student/dashboard"
        />
        <MobileNavLink icon={Store} label="Market" to="/student/marketplace" />
        <Link
          aria-label="Sell an item"
          className="flex items-center justify-center"
          to="/student/sell"
        >
          <span className="-mt-7 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#f8f9ff] bg-[#031635] text-white shadow-lg">
            <Plus aria-hidden="true" className="h-5 w-5" />
          </span>
        </Link>
        <MobileNavLink icon={ShoppingBag} label="Orders" to="/student/orders" />
        <MobileNavLink icon={UserRound} label="Profile" to="/student/profile" />
      </nav>
    </div>
  );
}

function TopNavLink({ label, to }: { label: string; to: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex h-full items-center border-b-2 px-1 text-sm font-semibold transition ${isActive ? 'border-[#031635] text-[#031635]' : 'border-transparent text-[#44474e] hover:text-[#031635]'}`
      }
      to={to}
    >
      {label}
    </NavLink>
  );
}

function SidebarLink({
  label,
  to,
  icon: Icon,
  onClick,
}: {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex min-h-12 items-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold leading-5 transition ${isActive ? 'bg-[#00ccf9] text-[#003846]' : 'text-[#27374c] hover:bg-white/65 hover:text-[#031635]'}`
      }
      onClick={onClick}
      to={to}
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  );
}

function HeaderIconLink({
  label,
  to,
  icon: Icon,
  badge,
}: {
  label: string;
  to: string;
  icon: typeof Heart;
  badge: number;
}) {
  return (
    <Link
      aria-label={`${label}${badge > 0 ? `, ${badge} items` : ''}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#27374c] hover:bg-[#eff4ff]"
      title={label}
      to={to}
    >
      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      {badge > 0 && (
        <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00677f] px-1 text-[9px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

function ProfileMenuLink({
  label,
  to,
  icon: Icon,
  onClick,
}: {
  label: string;
  to: string;
  icon: typeof UserRound;
  onClick: () => void;
}) {
  return (
    <Link
      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#27374c] hover:bg-[#eff4ff]"
      onClick={onClick}
      role="menuitem"
      to={to}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MobileNavLink({
  label,
  to,
  icon: Icon,
}: {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 text-[10px] ${isActive ? 'font-bold text-[#031635]' : 'font-medium text-[#68707d]'}`
      }
      to={to}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
      {label}
    </NavLink>
  );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      aria-label={`${name} profile`}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#d8e2ff] font-bold text-[#081b3a] shadow-sm ${large ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs'}`}
      role="img"
    >
      {initials(name)}
    </span>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Student';
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function shortCollegeName(name: string) {
  return name.length > 28 ? 'your college' : name;
}
