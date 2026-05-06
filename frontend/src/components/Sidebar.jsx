import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Target, Workflow, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar = () => {
  const { hasRole } = useAuth();

  const navItems = [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs',        icon: Briefcase,       label: 'Jobs' },
    { to: '/candidates',  icon: Users,           label: 'Candidates' },
    { to: '/applications',icon: FileText,        label: 'Applications' },
    { to: '/matches',     icon: Target,          label: 'Matches' },
    { to: '/profile',     icon: User,            label: 'Profile' },
  ];

  if (hasRole?.(['Admin', 'Recruiter'])) {
    navItems.splice(5, 0,
      { to: '/workflows',  icon: Workflow, label: 'Workflows' },
      { to: '/audit-logs', icon: Shield,   label: 'Audit Logs' }
    );
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold">ATS Platform</h2>
        <p className="text-xs text-gray-400 mt-1">Recruitment System</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">© 2025 ATS Platform</p>
      </div>
    </aside>
  );
};

export default Sidebar;
