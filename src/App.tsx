import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AdminLayout } from './components/admin/AdminLayout';
import { UserManagement } from './components/admin/UserManagement';
import { DisputesPanel } from './components/admin/DisputesPanel';
import { LogsPanel } from './components/admin/LogsPanel';
import { RevenuePanel } from './components/admin/RevenuePanel';
import Dashboard from './components/Dashboard';
import Signup from './pages/signup';
import { Login } from './components/Login';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'sonner';
import { AuthGuard } from './middleware/auth';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
  requireApproved?: boolean;
}> = ({ children, requireAdmin = false, requireClient = false, requireApproved = false }) => {
  return (
    <AuthGuard
      requireAdmin={requireAdmin}
      requireClient={requireClient}
      requireApproved={requireApproved}
    >
      {children}
    </AuthGuard>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        
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

        {/* Client Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireClient requireApproved>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// Pending Approval Page Component
const PendingApproval: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is being reviewed by our team. We'll notify you once it's approved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
