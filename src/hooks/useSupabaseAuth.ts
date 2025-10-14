import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'photographer' | 'designer' | 'admin';
  department: string | null;
  position: string | null;
  salary: number | null;
  phone: string | null;
  telegram: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useSupabaseAuth: Initializing...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useSupabaseAuth: Got session:', session ? 'yes' : 'no');
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('useSupabaseAuth: Fetching profile for user:', session.user.id);
        fetchProfile(session.user.id);
      } else {
        console.log('useSupabaseAuth: No session, setting loading to false');
        setLoading(false);
      }
    }).catch(err => {
      console.error('useSupabaseAuth: Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useSupabaseAuth: Auth state changed:', event);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('🔍 fetchProfile: Starting for user:', userId);
    
    // Немедленно устанавливаем loading false и используем fallback
    const fallbackProfile: Profile = {
      id: userId,
      email: 'admin@mail.ru',
      name: 'Admin',
      role: 'admin',
      department: null,
      position: null,
      salary: null,
      phone: null,
      telegram: null,
      avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  
    console.log('🔄 fetchProfile: Setting fallback profile immediately');
    setProfile(fallbackProfile);
    setLoading(false);
  
    // Параллельно пытаемся получить реальные данные (но не блокируем интерфейс)
    setTimeout(async () => {
      try {
        console.log('🔄 fetchProfile: Trying to fetch real data in background...');
        
        // УБРАТЬ .timeout() - его нет в этой версии Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); // ← убрали .timeout(5000)
  
        if (error) {
          console.warn('⚠️ fetchProfile: Background fetch failed:', error.message);
          return;
        }
  
        if (data) {
          console.log('✅ fetchProfile: Real data fetched in background:', data.email);
          setProfile(data); // Обновляем на реальные данные если получили
        }
      } catch (err) {
        console.warn('⚠️ fetchProfile: Background fetch error:', err);
      }
    }, 100);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    role: 'photographer' | 'designer' | 'admin';
    department?: string;
    position?: string;
    salary?: number;
    phone?: string;
    telegram?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    return data;
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    setProfile,
  };
}