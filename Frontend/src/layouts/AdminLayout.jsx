import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Headset,
  BarChart3,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/complaints', label: 'All Complaints', icon: ClipboardList },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/agents', label: 'Support Agents', icon: Headset },
    { to: '/admin/analytics', label: 'Analytics & Reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-950 text-slate-100">
      <div>
        <Link
          to="/admin"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-5 py-5 border-b border-slate-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">PulseDesk Admin</p>
            <p className="text-[11px] font-medium text-slate-400">Sentiment Intelligence</p>
          </div>
        </Link>

        <nav className="mt-5 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 rounded-xl bg-slate-900 px-3.5 py-2.5 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-64 h-full">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              Administrator Command Center
            </span>
          </div>
          <Link
            to="/admin/complaints"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Manage Queue &rarr;
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
