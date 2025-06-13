import React, { Suspense } from 'react';
import { lazy } from 'react';

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy-loaded components with Suspense wrapper
export const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

// Lazy-loaded components
export const AdminLayout = lazy(() => import('./admin/AdminLayout'));
export const UserManagement = lazy(() => import('./admin/UserManagement'));
export const DisputesPanel = lazy(() => import('./admin/DisputesPanel'));
export const LogsPanel = lazy(() => import('./admin/LogsPanel'));
export const RevenuePanel = lazy(() => import('./admin/RevenuePanel'));
export const Dashboard = lazy(() => import('./Dashboard'));
export const Signup = lazy(() => import('../pages/signup'));
export const Login = lazy(() => import('./Login'));
export const LandingPage = lazy(() => import('../pages/LandingPage'));
