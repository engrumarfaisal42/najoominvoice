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
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Install a global fetch wrapper that injects x-session-token on every
// Supabase request (REST, Storage, Functions). Reads the token live from
// localStorage so it stays in sync with login/logout and reloads.
let fetchPatched = false;
function installFetchInterceptor() {
  if (fetchPatched || typeof window === 'undefined') return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      if (SUPABASE_URL && url.startsWith(SUPABASE_URL)) {
        const token = localStorage.getItem(SESSION_KEY);
        if (token) {
          const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
          headers.set('x-session-token', token);
          init = { ...init, headers };
        }
      }
    } catch {
      // ignore — fall through to original fetch
    }
    return originalFetch(input as any, init);
  };
  fetchPatched = true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    installFetchInterceptor();
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
          .maybeSingle();

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
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { username, password },
      });

      if (error || !data?.session_token) {
        return false;
      }

      localStorage.setItem(SESSION_KEY, data.session_token);
      installFetchInterceptor();
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
