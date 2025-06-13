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

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as AuthUser);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

      if (data.user) {
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
          details: { email }
        });

        // Redirect based on role
        if (isAdmin(data.user)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }

        toast.success('Login successful');
        return { data, error: null };
      }

      return { data: null, error: new Error('No user data') };
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create appropriate profile based on role
        if (metadata.role === 'client') {
          await supabase.from('clients').insert({
            user_id: data.user.id,
            full_name: `${metadata.firstName} ${metadata.lastName}`,
            dob: metadata.dob,
            address: metadata.address,
            ssn_last4: metadata.ssnLast4
          });
        } else if (metadata.role === 'admin') {
          await supabase.from('admins').insert({
            id: data.user.id,
            role: 'admin'
          });
        }

        // Log signup
        await supabase.from('admin_logs').insert({
          admin_id: data.user.id,
          action: 'signup',
          details: { email, role: metadata.role }
        });

        toast.success('Account created successfully');
        return { data, error: null };
      }

      return { data: null, error: new Error('No user data') };
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action: 'logout'
        });
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      toast.success('Password reset instructions sent to your email');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || 'Password reset failed');
      return { error };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAdmin: user ? isAdmin(user) : false,
    isClient: user ? isClient(user) : false,
    isApproved: user ? isApproved(user) : false
  };
}; 