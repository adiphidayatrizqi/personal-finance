import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Temporary local auth guard. Replace with Supabase Auth later.

const AUTH_STORAGE_KEY = "worthly.auth.v1";

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  loggedInAt: string | null;
}

interface AuthContextValue {
  state: AuthState;
  hydrated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emptyAuthState(): AuthState {
  return { isAuthenticated: false, email: null, loggedInAt: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => emptyAuthState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw));
      }
    } catch {
      setState(emptyAuthState());
    }
    setHydrated(true);
  }, []);

  const ctx: AuthContextValue = useMemo(() => ({
    state,
    hydrated,
    login: (email: string) => {
      const authState: AuthState = {
        isAuthenticated: true,
        email,
        loggedInAt: new Date().toISOString(),
      };
      setState(authState);
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      } catch {}
    },
    logout: () => {
      setState(emptyAuthState());
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
    },
  }), [state, hydrated]);

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
