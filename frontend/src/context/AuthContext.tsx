import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (fullName: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  switchDemoUser: (role: 'traveler' | 'admin') => void;
}

const DEMO_TRAVELER: User = {
  id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  full_name: 'Radhe Sharma',
  email: 'radhe.travels@globetrotter.io',
  profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  language: 'English',
  role: 'user',
  is_active: true,
  email_verified: true,
  created_at: new Date().toISOString(),
};

const DEMO_ADMIN: User = {
  id: 'f9e8d7c6-b5a4-3210-9876-543210abcdef',
  full_name: 'Aria Chen (Administrator)',
  email: 'aria.admin@globetrotter.io',
  profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  language: 'English',
  role: 'admin',
  is_active: true,
  email_verified: true,
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('globetrotter_user');
    return saved ? JSON.parse(saved) : DEMO_TRAVELER;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('globetrotter_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('globetrotter_user');
    }
  }, [user]);

  const login = async (email: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if user exists in database
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (dbUser) {
        setUser({
          id: dbUser.id,
          full_name: dbUser.full_name,
          email: dbUser.email,
          profile_photo: dbUser.profile_photo || DEMO_TRAVELER.profile_photo,
          language: dbUser.language || 'English',
          role: dbUser.role || 'user',
          is_active: dbUser.is_active ?? true,
          email_verified: dbUser.email_verified ?? true,
        });
      } else {
        // Create user session with this email
        const newUser: User = {
          id: crypto.randomUUID(),
          full_name: email.split('@')[0].replace('.', ' '),
          email: email.trim().toLowerCase(),
          profile_photo: DEMO_TRAVELER.profile_photo,
          language: 'English',
          role: 'user',
          is_active: true,
          email_verified: true,
        };
        setUser(newUser);
      }
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    fullName: string,
    email: string,
    _password?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newUser: User = {
        id: crypto.randomUUID(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        profile_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        language: 'English',
        role: 'user',
        is_active: true,
        email_verified: true,
      };

      // Try inserting into users table
      try {
        await supabase.from('users').insert([
          {
            id: newUser.id,
            full_name: newUser.full_name,
            email: newUser.email,
            password_hash: 'demo-hash',
            is_active: true,
            email_verified: true,
          },
        ]);
      } catch (e) {
        // ignore if offline or RLS restricted
      }

      setUser(newUser);
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('globetrotter_user');
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    try {
      await supabase
        .from('users')
        .update({
          full_name: updated.full_name,
          profile_photo: updated.profile_photo,
          language: updated.language,
        })
        .eq('id', user.id);
    } catch (e) {
      // offline fallback
    }
  };

  const switchDemoUser = (role: 'traveler' | 'admin') => {
    if (role === 'admin') {
      setUser(DEMO_ADMIN);
    } else {
      setUser(DEMO_TRAVELER);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        updateUserProfile,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
