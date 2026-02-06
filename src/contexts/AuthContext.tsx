import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_USERNAME = 'najoommarket';
const ADMIN_PASSWORD = 'Faisal@@7';
const SESSION_KEY = 'invoice_app_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      try {
        const { data, error } = await supabase
          .from('admin_session')
          .select('*')
          .eq('session_token', sessionToken)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (data && !error) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      try {
        await supabase.from('admin_session').insert({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

        localStorage.setItem(SESSION_KEY, sessionToken);
        setIsAuthenticated(true);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      await supabase.from('admin_session').delete().eq('session_token', sessionToken);
    }
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
