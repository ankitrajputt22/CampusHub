import {
  BarChart3,
  Building2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const adminNav = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Colleges', to: '/admin/colleges', icon: Building2 },
  { label: 'Listings', to: '/admin/listings', icon: ListChecks },
  { label: 'Reports', to: '/admin/reports', icon: MessageSquareWarning },
  { label: 'Orders', to: '/admin/orders', icon: ClipboardList },
  { label: 'Payments', to: '/admin/payments', icon: CircleDollarSign },
  { label: 'Reviews', to: '/admin/reviews', icon: Star },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
];

const superAdminNav = [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Administrators', to: '/super-admin/admins', icon: UserCog },
  { label: 'Colleges', to: '/super-admin/colleges', icon: Building2 },
  { label: 'Analytics', to: '/super-admin/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/super-admin/settings', icon: Settings },
];

export function AdminShell({
  mode = 'admin',
}: {
  mode?: 'admin' | 'super-admin';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSuper = mode === 'super-admin';
  const navigation = isSuper ? superAdminNav : adminNav;

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0a2038] text-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-[70px] items-center justify-between border-b border-white/10 px-5">
          <Link
            className="flex items-center gap-3"
            to={isSuper ? '/super-admin/dashboard' : '/admin/dashboard'}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-xs font-black text-[#0a2038]">
              CH
            </span>
            <span>
              <span className="block text-sm font-bold">Campus Hub</span>
              <span className="block text-[11px] text-slate-400">
                {isSuper ? 'Platform Console' : 'College Admin'}
              </span>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-300 lg:hidden"
            onClick={() => setMenuOpen(false)}
            title="Close navigation"
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Workspace
          </p>
        </div>
        <nav
          className="flex-1 space-y-1 overflow-y-auto px-3"
          aria-label={`${isSuper ? 'Super admin' : 'Admin'} navigation`}
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-cyan-400 text-[#0a2038]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
                }
                key={item.to}
                onClick={() => setMenuOpen(false)}
                to={item.to}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
              {isSuper ? 'SA' : 'CA'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {isSuper ? 'Super Admin' : 'College Admin'}
              </p>
              <p className="truncate text-xs text-slate-400">Preview account</p>
            </div>
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[70px] items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            aria-label="Open navigation"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setMenuOpen(true)}
            title="Open navigation"
            type="button"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Secure admin session
            </span>
            <button
              className="flex items-center gap-2 text-sm font-semibold text-slate-700"
              type="button"
            >
              {isSuper ? 'Platform' : 'REC Bijnor'}
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
