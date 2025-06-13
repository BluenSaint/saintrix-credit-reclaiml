import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'sonner';
import { AuthGuard } from './components/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import {
  AdminLayout,
  UserManagement,
  DisputesPanel,
  LogsPanel,
  RevenuePanel,
  Dashboard,
  Signup,
  Login,
  LandingPage,
  withSuspense,
} from './components/lazy';

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
      <RouteErrorBoundary>{children}</RouteErrorBoundary>
    </AuthGuard>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={<RouteErrorBoundary>{withSuspense(LandingPage)}</RouteErrorBoundary>}
          />
          <Route
            path="/login"
            element={<RouteErrorBoundary>{withSuspense(Login)}</RouteErrorBoundary>}
          />
          <Route
            path="/signup"
            element={<RouteErrorBoundary>{withSuspense(Signup)}</RouteErrorBoundary>}
          />
          <Route
            path="/pending-approval"
            element={
              <RouteErrorBoundary>
                <PendingApproval />
              </RouteErrorBoundary>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<ProtectedRoute requireAdmin>{withSuspense(AdminLayout)}</ProtectedRoute>}
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route
              path="users"
              element={<RouteErrorBoundary>{withSuspense(UserManagement)}</RouteErrorBoundary>}
            />
            <Route
              path="disputes"
              element={<RouteErrorBoundary>{withSuspense(DisputesPanel)}</RouteErrorBoundary>}
            />
            <Route
              path="logs"
              element={<RouteErrorBoundary>{withSuspense(LogsPanel)}</RouteErrorBoundary>}
            />
            <Route
              path="revenue"
              element={<RouteErrorBoundary>{withSuspense(RevenuePanel)}</RouteErrorBoundary>}
            />
          </Route>

          {/* Client Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireClient requireApproved>
                {withSuspense(Dashboard)}
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

// Pending Approval Page Component
const PendingApproval: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Account Pending Approval</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is being reviewed by our team. We'll notify you once it's approved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
