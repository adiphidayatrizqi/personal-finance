import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

// Finance data is still stored locally. Supabase database migration will be done later.

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
}

interface AuthContextValue {
  state: AuthState;
  hydrated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emptyAuthState(): AuthState {
  return { isAuthenticated: false, email: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => emptyAuthState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session?.user?.email) {
          setState({
            isAuthenticated: true,
            email: session.user.email,
          });
        }
        setHydrated(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user?.email) {
          setState({
            isAuthenticated: true,
            email: session.user.email,
          });
        } else {
          setState(emptyAuthState());
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const ctx: AuthContextValue = useMemo(
    () => ({
      state,
      hydrated,
      logout: async () => {
        await supabase.auth.signOut();
      },
    }),
    [state, hydrated]
  );

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
