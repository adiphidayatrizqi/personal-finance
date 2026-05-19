import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FinanceState, Wallet, Category, Transaction, Holding, PriceSource, Budget, Goal } from "./types";
import { seedState } from "./seed";

const STORAGE_KEY = "savvr.finance.v1";

type Updater<T> = (items: T[]) => T[];

interface Ctx {
  state: FinanceState;
  hydrated: boolean;
  setWallets: (u: Updater<Wallet>) => void;
  setCategories: (u: Updater<Category>) => void;
  setTransactions: (u: Updater<Transaction>) => void;
  setHoldings: (u: Updater<Holding>) => void;
  setPrices: (u: Updater<PriceSource>) => void;
  setBudgets: (u: Updater<Budget>) => void;
  setGoals: (u: Updater<Goal>) => void;
  reset: () => void;
}

const FinanceContext = createContext<Ctx | null>(null);

function emptyState(): FinanceState {
  return { wallets: [], categories: [], transactions: [], holdings: [], prices: [], budgets: [], goals: [] };
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  // Start with empty during SSR to avoid hydration mismatch
  const [state, setState] = useState<FinanceState>(() => emptyState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw));
      } else {
        const seeded = seedState();
        setState(seeded);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      }
    } catch {
      setState(seedState());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const ctx: Ctx = useMemo(() => ({
    state,
    hydrated,
    setWallets: (u) => setState((s) => ({ ...s, wallets: u(s.wallets) })),
    setCategories: (u) => setState((s) => ({ ...s, categories: u(s.categories) })),
    setTransactions: (u) => setState((s) => ({ ...s, transactions: u(s.transactions) })),
    setHoldings: (u) => setState((s) => ({ ...s, holdings: u(s.holdings) })),
    setPrices: (u) => setState((s) => ({ ...s, prices: u(s.prices) })),
    setBudgets: (u) => setState((s) => ({ ...s, budgets: u(s.budgets) })),
    setGoals: (u) => setState((s) => ({ ...s, goals: u(s.goals) })),
    reset: () => { setState(seedState()); },
  }), [state, hydrated]);

  return <FinanceContext.Provider value={ctx}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
