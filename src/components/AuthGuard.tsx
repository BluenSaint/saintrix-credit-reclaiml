import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
  requireApproved?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  requireClient = false,
  requireApproved = false,
}) => {
  const { user, loading, isAdmin, isClient, isApproved } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please log in to access this page');
        navigate('/login');
        return;
      }

      if (requireAdmin && !isAdmin) {
        toast.error('Admin access required');
        navigate('/dashboard');
        return;
      }

      if (requireClient && !isClient) {
        toast.error('Client access required');
        navigate('/admin');
        return;
      }

      if (requireApproved && !isApproved) {
        toast.info('Your account is pending approval');
        navigate('/pending-approval');
        return;
      }
    }
  }, [
    user,
    loading,
    requireAdmin,
    requireClient,
    requireApproved,
    navigate,
    isAdmin,
    isClient,
    isApproved,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};
