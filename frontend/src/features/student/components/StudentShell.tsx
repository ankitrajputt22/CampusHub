import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PackageCheck,
  PlusCircle,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { getCampusUser } from '../lib/session';

const navItems = [
  { label: 'Dashboard', to: '/student/dashboard', icon: Home },
  { label: 'My College', to: '/student/marketplace', icon: ShoppingBag },
  { label: 'Explore Colleges', to: '/student/explore-colleges', icon: Compass },
  { label: 'Sell Item', to: '/student/sell', icon: PlusCircle },
  { label: 'My Marketplace', to: '/student/my-marketplace', icon: Store },
  { label: 'Orders', to: '/student/orders', icon: PackageCheck },
  { label: 'Wishlist', to: '/student/wishlist', icon: Heart },
  { label: 'Notifications', to: '/student/notifications', icon: Bell },
  { label: 'Reviews', to: '/student/reviews', icon: Star },
  { label: 'Payments', to: '/student/payments', icon: CircleDollarSign },
  { label: 'Profile', to: '/student/profile', icon: UserRound },
  { label: 'Settings', to: '/student/settings', icon: Settings },
  { label: 'Chat', to: '/student/chat', icon: MessageSquare },
];

export function StudentShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getCampusUser();

  function logout() {
    window.localStorage.removeItem('campusHub.auth.accessToken');
    window.localStorage.removeItem('campusHub.auth.refreshToken');
    window.localStorage.removeItem('campusHub.auth.user');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-[#071b33] text-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
          <Link
            className="flex min-w-0 items-center gap-3"
            onClick={() => setMenuOpen(false)}
            to="/student/dashboard"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-xs font-black text-[#071b33]">
              CH
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">Campus Hub</p>
              <p className="truncate text-xs text-slate-400">
                Verified marketplace
              </p>
            </div>
          </Link>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen(false)}
            title="Close navigation"
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            Your campus
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-slate-200">
            {user.collegeName}
          </p>
        </div>

        <nav
          aria-label="Student navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${isActive ? 'bg-cyan-400 text-[#071b33]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
                }
                key={item.to}
                onClick={() => setMenuOpen(false)}
                to={item.to}
              >
                <Icon
                  aria-hidden="true"
                  className="h-[18px] w-[18px] shrink-0"
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={logout}
            type="button"
          >
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            aria-label="Open navigation"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setMenuOpen(true)}
            title="Open navigation"
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-xl flex-1 sm:block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Search Campus Hub"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              placeholder="Search listings, sellers, or categories"
              type="search"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              aria-label="Notifications"
              className="relative rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              title="Notifications"
              to="/student/notifications"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </Link>
            <Link
              className="flex h-11 items-center gap-3 rounded-lg px-2 hover:bg-slate-50"
              to="/student/profile"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dff6f2] text-sm font-bold text-emerald-800">
                {initials(user.fullName)}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-36 truncate text-sm font-semibold text-slate-900">
                  {user.fullName}
                </span>
                <span className="block text-xs text-slate-500">
                  Trust {user.trustScore}/100
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className="hidden h-4 w-4 text-slate-400 md:block"
              />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
