import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isAdmin, isClient, isApproved } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    role: 'admin' | 'client';
    approved?: boolean;
    [key: string]: any;
  };
}

export interface AuthError extends Error {
  status?: number;
  code?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Initializing auth hook...');

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log('User session found:', session.user);
          setUser(session.user as AuthUser);
        } else {
          console.log('No active session found');
          setUser(null);
        }
      } catch (err) {
        const authError =
          err instanceof Error
            ? (err as AuthError)
            : (new Error('Unknown auth error') as AuthError);
        console.error('Auth initialization error:', authError);
        setError(authError);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user);

      if (session?.user) {
        setUser(session.user as AuthUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user data received');
      }

      // Check role and approval status
      const role = data.user.user_metadata?.role;
      if (!role) {
        throw new Error('Account not fully set up. Please contact support.');
      }

      if (role === 'client' && !isApproved(data.user)) {
        navigate('/pending-approval');
        toast.info('Your account is pending admin approval.');
        return { data: null, error: new Error('Account pending approval') };
      }

      // Log successful login
      await supabase.from('admin_logs').insert({
        admin_id: data.user.id,
        action: 'login',
        details: { email },
      });

      // Redirect based on role
      if (isAdmin(data.user)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

      toast.success('Login successful');
      return { data, error: null };
    } catch (error) {
      const authError =
        error instanceof Error ? (error as AuthError) : (new Error('Login failed') as AuthError);
      toast.error(authError.message);
      return { data: null, error: authError };
    }
  };

  const signUp = async (email: string, password: string, metadata: Record<string, any>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user data received');
      }

      // Create appropriate profile based on role
      if (metadata.role === 'client') {
        await supabase.from('clients').insert({
          user_id: data.user.id,
          full_name: `${metadata.firstName} ${metadata.lastName}`,
          dob: metadata.dob,
          address: metadata.address,
          ssn_last4: metadata.ssnLast4,
        });
      } else if (metadata.role === 'admin') {
        await supabase.from('admins').insert({
          id: data.user.id,
          role: 'admin',
        });
      }

      // Log signup
      await supabase.from('admin_logs').insert({
        admin_id: data.user.id,
        action: 'signup',
        details: { email, role: metadata.role },
      });

      toast.success('Account created successfully');
      return { data, error: null };
    } catch (error) {
      const authError =
        error instanceof Error ? (error as AuthError) : (new Error('Signup failed') as AuthError);
      toast.error(authError.message);
      return { data: null, error: authError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      const authError =
        err instanceof Error ? (err as AuthError) : (new Error('Failed to sign out') as AuthError);
      toast.error(authError.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      toast.success('Password reset instructions sent to your email');
      return { error: null };
    } catch (error) {
      const authError =
        error instanceof Error
          ? (error as AuthError)
          : (new Error('Password reset failed') as AuthError);
      toast.error(authError.message);
      return { error: authError };
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAdmin: user ? isAdmin(user) : false,
    isClient: user ? isClient(user) : false,
    isApproved: user ? isApproved(user) : false,
  };
};
