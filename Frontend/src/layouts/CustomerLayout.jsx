import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquarePlus,
  FileText,
  UserCircle,
  LogOut,
  Headphones,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/customer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/customer/submit', label: 'Submit Complaint', icon: MessageSquarePlus },
    { to: '/customer/complaints', label: 'My Complaints', icon: FileText },
    { to: '/customer/profile', label: 'My Profile', icon: UserCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100">
      <div>
        <Link
          to="/customer"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-5 py-5 border-b border-slate-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">PulseDesk AI</p>
            <p className="text-[11px] font-medium text-slate-400">Customer Support Portal</p>
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
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
        <div className="mb-3 rounded-xl bg-slate-800/70 px-3.5 py-2.5">
          <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
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

      {/* Main Content */}
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
              Helpdesk Customer Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/customer/submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Complaint
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
