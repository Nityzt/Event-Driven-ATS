import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Candidates from './pages/Candidates';
import Applications from './pages/Applications';
import Matches from './pages/Matches';
import Workflows from './pages/Workflows';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="jobs"         element={<Jobs />} />
            <Route path="candidates"   element={<Candidates />} />
            <Route path="applications" element={<Applications />} />
            <Route path="matches"      element={<Matches />} />
            <Route path="profile"      element={<Profile />} />

            {/* Workflows + Runs — Admin & Recruiter only */}
            <Route
              path="workflows"
              element={
                <ProtectedRoute roles={['Admin', 'Recruiter']}>
                  <Workflows />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs — Admin & Recruiter only */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute roles={['Admin', 'Recruiter']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
