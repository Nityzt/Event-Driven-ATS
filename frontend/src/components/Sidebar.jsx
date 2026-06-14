import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Target, Workflow, Shield, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const ROLE_BADGE = {
  Admin:     'bg-brand-100 text-brand-800',
  Recruiter: 'bg-amber-100 text-amber-800',
  Viewer:    'bg-stone-200 text-stone-600',
};

const PRIMARY_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',         icon: Briefcase,       label: 'Jobs' },
  { to: '/candidates',   icon: Users,           label: 'Candidates' },
  { to: '/applications', icon: FileText,        label: 'Applications' },
  { to: '/matches',      icon: Target,          label: 'Matches' },
];

const PRIVILEGED_NAV = [
  { to: '/workflows',  icon: Workflow, label: 'Workflows' },
  { to: '/audit-logs', icon: Shield,   label: 'Audit Logs' },
];

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, hasRole } = useAuth();

  const navItems = [
    ...PRIMARY_NAV,
    ...(hasRole?.(['Admin', 'Recruiter']) ? PRIVILEGED_NAV : []),
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-surface-subtle border-r border-stone-200 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0 lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-base leading-none">T</span>
          </div>
          <div>
            <p className="text-stone-900 font-semibold text-base leading-tight tracking-tight">TalentBay</p>
            <p className="text-stone-400 text-2xs font-medium uppercase tracking-widest leading-tight">Recruitment OS</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeOnMobile}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Left accent bar — the recurring identity mark for the active route */}
                <span
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-brand-600 transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden="true"
                />
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-stone-200 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-stone-800 text-sm font-medium truncate">{user?.name || 'User'}</p>
            <span className={cn('text-2xs font-semibold rounded px-1.5 py-0.5 inline-block mt-0.5', ROLE_BADGE[user?.role] || ROLE_BADGE.Viewer)}>
              {user?.role || 'Member'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
