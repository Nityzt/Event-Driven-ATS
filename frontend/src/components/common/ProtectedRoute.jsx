import { Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Access Denied</h2>
          <p className="text-sm text-zinc-500">
            This page requires the <span className="font-medium text-zinc-700">{roles.join(' or ')}</span> role.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
