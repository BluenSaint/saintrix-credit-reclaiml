import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AdminLayout } from './components/admin/AdminLayout';
import { UserManagement } from './components/admin/UserManagement';
import { DisputesPanel } from './components/admin/DisputesPanel';
import { LogsPanel } from './components/admin/LogsPanel';
import { RevenuePanel } from './components/admin/RevenuePanel';
import Dashboard from './components/Dashboard';
import { SignupFlow } from './components/signup/SignupFlow';
import { Login } from './components/Login';
import { useAuthMiddleware } from './middleware';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireAdmin?: boolean;
}> = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  useAuthMiddleware();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin/users" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="disputes" element={<DisputesPanel />} />
          <Route path="logs" element={<LogsPanel />} />
          <Route path="revenue" element={<RevenuePanel />} />
        </Route>

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/signup" element={<SignupFlow />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
