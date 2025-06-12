import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  role: 'admin' | 'user';
  full_name: string;
  intake_status: string;
  credit_insurance: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        ...data,
        role: data.role || 'user',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserData(data.user.id);
        await logAction(data.user.id, 'login', { email });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await logAction(user.id, 'logout');
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'user',
            intake_status: 'pending',
            credit_insurance: false,
          }]);

        if (profileError) throw profileError;

        await fetchUserData(data.user.id);
        await logAction(data.user.id, 'signup', { email, fullName });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const logAction = async (userId: string, action: string, details?: any) => {
    try {
      const { error } = await supabase.rpc('log_admin_action', {
        p_user_id: userId,
        p_action: action,
        p_details: details,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    signUp,
  };
}; 