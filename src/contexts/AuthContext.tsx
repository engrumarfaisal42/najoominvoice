import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'invoice_app_session';

// Helper to set the session token header on the Supabase client
function setSessionHeader(token: string | null) {
  if (token) {
    // @ts-ignore - setting global headers for RLS validation
    supabase['rest']['headers']['x-session-token'] = token;
    // Also set on realtime if needed
  } else {
    // @ts-ignore
    delete supabase['rest']['headers']['x-session-token'];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      // Set header before making the validation query
      setSessionHeader(sessionToken);
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
          setSessionHeader(null);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
        setSessionHeader(null);
      }
    }
    setIsLoading(false);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { username, password },
      });

      if (error || !data?.session_token) {
        return false;
      }

      const sessionToken = data.session_token;
      localStorage.setItem(SESSION_KEY, sessionToken);
      setSessionHeader(sessionToken);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      await supabase.from('admin_session').delete().eq('session_token', sessionToken);
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionHeader(null);
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
