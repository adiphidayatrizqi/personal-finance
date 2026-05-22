import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FinanceState, Wallet, Category, Transaction, Holding, PriceSource, Budget, Goal } from "./types";
import { uid } from "./seed";
import { useAuth } from "../auth/store";
import {
  fetchWallets,
  fetchCategories,
  fetchTransactions,
  fetchBudgets,
  fetchGoals,
  fetchHoldings,
  fetchPriceSources,
  createCategory as createCategorySupabase,
  updateCategory as updateCategorySupabase,
  archiveCategory as archiveCategorySupabase,
  createWallet as createWalletSupabase,
  updateWallet as updateWalletSupabase,
  archiveWallet as archiveWalletSupabase,
  deleteWallet as deleteWalletSupabase,
  createTransaction as createTransactionSupabase,
  updateTransaction as updateTransactionSupabase,
  deleteTransaction as deleteTransactionSupabase,
  createBudget as createBudgetSupabase,
  updateBudget as updateBudgetSupabase,
  deleteBudget as deleteBudgetSupabase,
  createGoal as createGoalSupabase,
  updateGoal as updateGoalSupabase,
  deleteGoal as deleteGoalSupabase,
  createHolding as createHoldingSupabase,
  updateHolding as updateHoldingSupabase,
  deleteHolding as deleteHoldingSupabase,
  createPriceSource as createPriceSourceSupabase,
  updatePriceSource as updatePriceSourceSupabase,
  deletePriceSource as deletePriceSourceSupabase,
} from "../supabase/finance-service";

const STORAGE_KEY = "savvr.finance.v1";

function defaultCategories(): Category[] {
  const expCats = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Family", "Subscription", "Miscellaneous"];
  const incCats = ["Salary", "Bonus", "Cashback", "Gift", "Other Income"];
  const invCats = ["Gold", "FX", "Crypto", "Stock"];

  return [
    ...expCats.map((n) => ({ id: uid(), name: n, kind: "expense" as const, icon: "💸", archived: false })),
    ...incCats.map((n) => ({ id: uid(), name: n, kind: "income" as const, icon: "💰", archived: false })),
    ...invCats.map((n) => ({ id: uid(), name: n, kind: "investment" as const, icon: "📈", archived: false })),
  ];
}

function emptyState(): FinanceState {
  return { wallets: [], categories: defaultCategories(), transactions: [], holdings: [], prices: [], budgets: [], goals: [] };
}

type Updater<T> = (items: T[]) => T[];

type DataSource = "supabase" | "localStorage" | "fallback";

interface Ctx {
  state: FinanceState;
  hydrated: boolean;
  dataSource: DataSource;
  lastLoadedFromSupabase: string | null;
  fallbackUsed: boolean;
  setWallets: (u: Updater<Wallet>) => void;
  setCategories: (u: Updater<Category>) => void;
  setTransactions: (u: Updater<Transaction>) => void;
  setHoldings: (u: Updater<Holding>) => void;
  setPrices: (u: Updater<PriceSource>) => void;
  setBudgets: (u: Updater<Budget>) => void;
  setGoals: (u: Updater<Goal>) => void;
  reset: () => void;
  // Step 22A: Category write operations backed by Supabase
  createCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  archiveCategory: (categoryId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // Step 22B: Wallet write operations backed by Supabase
  createWallet: (wallet: Wallet) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  archiveWallet: (walletId: string) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  // Step 22C: Transaction write operations backed by Supabase
  createTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  // Step 22D: Budget write operations backed by Supabase
  createBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  // Step 22D: Goal write operations backed by Supabase
  createGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  // Step 22E: Holding write operations backed by Supabase
  createHolding: (holding: Holding) => Promise<void>;
  updateHolding: (holding: Holding) => Promise<void>;
  deleteHolding: (holdingId: string) => Promise<void>;
  // Step 22E: Price source write operations backed by Supabase
  createPriceSource: (priceSource: PriceSource) => Promise<void>;
  updatePriceSource: (priceSource: PriceSource) => Promise<void>;
  deletePriceSource: (priceSourceId: string) => Promise<void>;
}

const FinanceContext = createContext<Ctx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  // Start with empty during SSR to avoid hydration mismatch
  const [state, setState] = useState<FinanceState>(() => emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>("localStorage");
  const [lastLoadedFromSupabase, setLastLoadedFromSupabase] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  
  const { state: authState, hydrated: authHydrated } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Wait for auth to hydrate before deciding data source
    if (!authHydrated) return;

    const loadFinanceData = async () => {
      try {
        // If user is authenticated, try to load from Supabase
        if (authState.isAuthenticated) {
          try {
            const [
              wallets,
              categories,
              transactions,
              budgets,
              goals,
              holdings,
              priceSources,
            ] = await Promise.all([
              fetchWallets(),
              fetchCategories(),
              fetchTransactions(),
              fetchBudgets(),
              fetchGoals(),
              fetchHoldings(),
              fetchPriceSources(),
            ]);

            const supabaseState: FinanceState = {
              wallets,
              categories,
              transactions,
              budgets,
              goals,
              holdings,
              prices: priceSources,
            };

            setState(supabaseState);
            setDataSource("supabase");
            setLastLoadedFromSupabase(new Date().toISOString());
            setFallbackUsed(false);
            
            // Cache to localStorage as backup
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseState));
            } catch {}
          } catch (supabaseError) {
            // Supabase fetch failed, fallback to localStorage
            console.error("Failed to load from Supabase, falling back to localStorage:", supabaseError);
            loadFromLocalStorage(true);
          }
        } else {
          // Not authenticated, use localStorage
          loadFromLocalStorage(false);
        }
      } catch (error) {
        console.error("Error loading finance data:", error);
        loadFromLocalStorage(true);
      } finally {
        setHydrated(true);
      }
    };

    loadFinanceData();
  }, [authHydrated, authState.isAuthenticated]);

  const loadFromLocalStorage = (isFallback: boolean) => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw));
      } else {
        const empty = emptyState();
        setState(empty);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      }
      setDataSource(isFallback ? "fallback" : "localStorage");
      setFallbackUsed(isFallback);
    } catch {
      setState(emptyState());
      setDataSource(isFallback ? "fallback" : "localStorage");
      setFallbackUsed(isFallback);
    }
  };

  // Step 21: Reads are loaded from Supabase when authenticated. Write operations will be switched in Step 22.
  // For now, we still cache state to localStorage as backup, but it's not the primary source when authenticated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  // Step 22A: Category write operations backed by Supabase
  const createCategory = async (category: Category) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create categories");
    }

    try {
      const created = await createCategorySupabase(category);
      setState((s) => ({ ...s, categories: [...s.categories, created] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create category");
    }
  };

  const updateCategory = async (category: Category) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update categories");
    }

    try {
      const updated = await updateCategorySupabase(category);
      setState((s) => ({ ...s, categories: s.categories.map((c) => c.id === updated.id ? updated : c) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const archiveCategory = async (categoryId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to archive categories");
    }

    try {
      const archived = await archiveCategorySupabase(categoryId);
      setState((s) => ({ ...s, categories: s.categories.map((c) => c.id === archived.id ? archived : c) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to archive category");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete categories");
    }

    // For now, we don't have a deleteCategory function in the service layer
    // We'll implement it as archive for safety
    try {
      const archived = await archiveCategorySupabase(categoryId);
      setState((s) => ({ ...s, categories: s.categories.map((c) => c.id === archived.id ? archived : c) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  // Step 22B: Wallet write operations backed by Supabase
  const createWallet = async (wallet: Wallet) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create wallets");
    }

    try {
      const created = await createWalletSupabase(wallet);
      setState((s) => ({ ...s, wallets: [...s.wallets, created] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create wallet");
    }
  };

  const updateWallet = async (wallet: Wallet) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update wallets");
    }

    try {
      const updated = await updateWalletSupabase(wallet);
      setState((s) => ({ ...s, wallets: s.wallets.map((w) => w.id === updated.id ? updated : w) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update wallet");
    }
  };

  const archiveWallet = async (walletId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to archive wallets");
    }

    try {
      const archived = await archiveWalletSupabase(walletId);
      setState((s) => ({ ...s, wallets: s.wallets.map((w) => w.id === archived.id ? archived : w) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to archive wallet");
    }
  };

  const deleteWallet = async (walletId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete wallets");
    }

    try {
      await deleteWalletSupabase(walletId);
      setState((s) => ({ ...s, wallets: s.wallets.filter((w) => w.id !== walletId) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete wallet");
    }
  };

  // Step 22C: Transaction write operations backed by Supabase
  const createTransaction = async (transaction: Transaction) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create transactions");
    }

    try {
      const created = await createTransactionSupabase(transaction);
      setState((s) => ({ ...s, transactions: [created, ...s.transactions] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create transaction");
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update transactions");
    }

    try {
      const updated = await updateTransactionSupabase(transaction);
      setState((s) => ({ ...s, transactions: s.transactions.map((t) => t.id === updated.id ? updated : t) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update transaction");
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete transactions");
    }

    try {
      await deleteTransactionSupabase(transactionId);
      setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== transactionId) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };

  // Step 22D: Budget write operations backed by Supabase
  const createBudget = async (budget: Budget) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create budgets");
    }

    try {
      const created = await createBudgetSupabase(budget);
      setState((s) => ({ ...s, budgets: [...s.budgets, created] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create budget");
    }
  };

  const updateBudget = async (budget: Budget) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update budgets");
    }

    try {
      const updated = await updateBudgetSupabase(budget);
      setState((s) => ({ ...s, budgets: s.budgets.map((b) => b.id === updated.id ? updated : b) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update budget");
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete budgets");
    }

    try {
      await deleteBudgetSupabase(budgetId);
      setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== budgetId) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete budget");
    }
  };

  // Step 22D: Goal write operations backed by Supabase
  const createGoal = async (goal: Goal) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create goals");
    }

    try {
      const created = await createGoalSupabase(goal);
      setState((s) => ({ ...s, goals: [...s.goals, created] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create goal");
    }
  };

  const updateGoal = async (goal: Goal) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update goals");
    }

    try {
      const updated = await updateGoalSupabase(goal);
      setState((s) => ({ ...s, goals: s.goals.map((g) => g.id === updated.id ? updated : g) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update goal");
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete goals");
    }

    try {
      await deleteGoalSupabase(goalId);
      setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goalId) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete goal");
    }
  };

  // Step 22E: Holding write operations backed by Supabase
  const createHolding = async (holding: Holding) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create holdings");
    }

    try {
      const created = await createHoldingSupabase(holding);
      setState((s) => ({ ...s, holdings: [...s.holdings, created] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create holding");
    }
  };

  const updateHolding = async (holding: Holding) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update holdings");
    }

    try {
      const updated = await updateHoldingSupabase(holding);
      setState((s) => ({ ...s, holdings: s.holdings.map((h) => h.id === updated.id ? updated : h) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update holding");
    }
  };

  const deleteHolding = async (holdingId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete holdings");
    }

    try {
      await deleteHoldingSupabase(holdingId);
      setState((s) => ({ ...s, holdings: s.holdings.filter((h) => h.id !== holdingId) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete holding");
    }
  };

  // Step 22E: Price source write operations backed by Supabase
  const createPriceSource = async (priceSource: PriceSource) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to create price sources");
    }

    try {
      const created = await createPriceSourceSupabase(priceSource);
      setState((s) => ({ ...s, prices: [...s.prices, created] }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create price source");
    }
  };

  const updatePriceSource = async (priceSource: PriceSource) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to update price sources");
    }

    try {
      const updated = await updatePriceSourceSupabase(priceSource);
      setState((s) => ({ ...s, prices: s.prices.map((p) => p.id === updated.id ? updated : p) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update price source");
    }
  };

  const deletePriceSource = async (priceSourceId: string) => {
    if (!authState.isAuthenticated) {
      throw new Error("Please log in to delete price sources");
    }

    try {
      await deletePriceSourceSupabase(priceSourceId);
      setState((s) => ({ ...s, prices: s.prices.filter((p) => p.id !== priceSourceId) }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to delete price source");
    }
  };

  const ctx: Ctx = useMemo(() => ({
    state,
    hydrated,
    dataSource,
    lastLoadedFromSupabase,
    fallbackUsed,
    setWallets: (u) => setState((s) => ({ ...s, wallets: u(s.wallets) })),
    setCategories: (u) => setState((s) => ({ ...s, categories: u(s.categories) })),
    setTransactions: (u) => setState((s) => ({ ...s, transactions: u(s.transactions) })),
    setHoldings: (u) => setState((s) => ({ ...s, holdings: u(s.holdings) })),
    setPrices: (u) => setState((s) => ({ ...s, prices: u(s.prices) })),
    setBudgets: (u) => setState((s) => ({ ...s, budgets: u(s.budgets) })),
    setGoals: (u) => setState((s) => ({ ...s, goals: u(s.goals) })),
    reset: () => { setState(emptyState()); },
    createCategory,
    updateCategory,
    archiveCategory,
    deleteCategory,
    createWallet,
    updateWallet,
    archiveWallet,
    deleteWallet,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createBudget,
    updateBudget,
    deleteBudget,
    createGoal,
    updateGoal,
    deleteGoal,
    createHolding,
    updateHolding,
    deleteHolding,
    createPriceSource,
    updatePriceSource,
    deletePriceSource,
  }), [state, hydrated, dataSource, lastLoadedFromSupabase, fallbackUsed, authState.isAuthenticated, createCategory, updateCategory, archiveCategory, deleteCategory, createWallet, updateWallet, archiveWallet, deleteWallet, createTransaction, updateTransaction, deleteTransaction, createBudget, updateBudget, deleteBudget, createGoal, updateGoal, deleteGoal, createHolding, updateHolding, deleteHolding, createPriceSource, updatePriceSource, deletePriceSource]);

  return <FinanceContext.Provider value={ctx}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
