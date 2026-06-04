import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Target, Workflow, Shield, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const ROLE_COLORS = {
  Admin:     'bg-purple-100 text-purple-700',
  Recruiter: 'bg-brand-100 text-brand-700',
  Viewer:    'bg-zinc-100 text-zinc-600',
};

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, hasRole } = useAuth();

  const navItems = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs',         icon: Briefcase,       label: 'Jobs' },
    { to: '/candidates',   icon: Users,           label: 'Candidates' },
    { to: '/applications', icon: FileText,        label: 'Applications' },
    { to: '/matches',      icon: Target,          label: 'Matches' },
  ];

  if (hasRole?.(['Admin', 'Recruiter'])) {
    navItems.push(
      { to: '/workflows',  icon: Workflow, label: 'Workflows' },
      { to: '/audit-logs', icon: Shield,   label: 'Audit Logs' },
    );
  }

  navItems.push({ to: '/profile', icon: User, label: 'Profile' });

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0 lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base leading-none">T</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">TalentFlow</p>
            <p className="text-zinc-400 text-2xs leading-tight">Recruitment Platform</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                  'text-sm font-medium',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className={cn('text-2xs font-medium rounded px-1 py-0.5 inline-block mt-0.5', ROLE_COLORS[user?.role] || 'bg-zinc-100 text-zinc-600')}>
              {user?.role || 'Member'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
