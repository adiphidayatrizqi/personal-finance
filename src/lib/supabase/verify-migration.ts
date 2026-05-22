import type { FinanceState } from "../finance/types";
import {
  fetchCategories,
  fetchWallets,
  fetchTransactions,
  fetchBudgets,
  fetchGoals,
  fetchHoldings,
  fetchPriceSources,
} from "./finance-service";

export type TableStatus = "matched" | "missing" | "extra" | "not_migrated";

export interface TableVerificationStatus {
  localCount: number;
  supabaseCount: number;
  status: TableStatus;
  difference: number;
}

export interface MigrationVerificationResult {
  categories: TableVerificationStatus;
  wallets: TableVerificationStatus;
  transactions: TableVerificationStatus;
  budgets: TableVerificationStatus;
  goals: TableVerificationStatus;
  holdings: TableVerificationStatus;
  priceSources: TableVerificationStatus;
  overallStatus: "ready" | "not_ready" | "review_required";
}

function calculateStatus(localCount: number, supabaseCount: number): TableStatus {
  if (localCount === 0 && supabaseCount === 0) {
    return "matched";
  }
  if (localCount > 0 && supabaseCount === 0) {
    return "not_migrated";
  }
  if (localCount === supabaseCount) {
    return "matched";
  }
  if (supabaseCount < localCount) {
    return "missing";
  }
  if (supabaseCount > localCount) {
    return "extra";
  }
  return "matched";
}

export async function verifyMigrationStatus(
  localState: FinanceState
): Promise<MigrationVerificationResult> {
  // Fetch all data from Supabase
  const [
    supabaseCategories,
    supabaseWallets,
    supabaseTransactions,
    supabaseBudgets,
    supabaseGoals,
    supabaseHoldings,
    supabasePriceSources,
  ] = await Promise.all([
    fetchCategories(),
    fetchWallets(),
    fetchTransactions(),
    fetchBudgets(),
    fetchGoals(),
    fetchHoldings(),
    fetchPriceSources(),
  ]);

  // Calculate status for each table
  const categories: TableVerificationStatus = {
    localCount: localState.categories.length,
    supabaseCount: supabaseCategories.length,
    status: calculateStatus(localState.categories.length, supabaseCategories.length),
    difference: localState.categories.length - supabaseCategories.length,
  };

  const wallets: TableVerificationStatus = {
    localCount: localState.wallets.length,
    supabaseCount: supabaseWallets.length,
    status: calculateStatus(localState.wallets.length, supabaseWallets.length),
    difference: localState.wallets.length - supabaseWallets.length,
  };

  const transactions: TableVerificationStatus = {
    localCount: localState.transactions.length,
    supabaseCount: supabaseTransactions.length,
    status: calculateStatus(localState.transactions.length, supabaseTransactions.length),
    difference: localState.transactions.length - supabaseTransactions.length,
  };

  const budgets: TableVerificationStatus = {
    localCount: localState.budgets.length,
    supabaseCount: supabaseBudgets.length,
    status: calculateStatus(localState.budgets.length, supabaseBudgets.length),
    difference: localState.budgets.length - supabaseBudgets.length,
  };

  const goals: TableVerificationStatus = {
    localCount: localState.goals.length,
    supabaseCount: supabaseGoals.length,
    status: calculateStatus(localState.goals.length, supabaseGoals.length),
    difference: localState.goals.length - supabaseGoals.length,
  };

  const holdings: TableVerificationStatus = {
    localCount: localState.holdings.length,
    supabaseCount: supabaseHoldings.length,
    status: calculateStatus(localState.holdings.length, supabaseHoldings.length),
    difference: localState.holdings.length - supabaseHoldings.length,
  };

  const priceSources: TableVerificationStatus = {
    localCount: localState.prices.length,
    supabaseCount: supabasePriceSources.length,
    status: calculateStatus(localState.prices.length, supabasePriceSources.length),
    difference: localState.prices.length - supabasePriceSources.length,
  };

  // Calculate overall status
  const allStatuses = [
    categories.status,
    wallets.status,
    transactions.status,
    budgets.status,
    goals.status,
    holdings.status,
    priceSources.status,
  ];

  let overallStatus: "ready" | "not_ready" | "review_required";
  if (allStatuses.every((s) => s === "matched")) {
    overallStatus = "ready";
  } else if (allStatuses.some((s) => s === "not_migrated" || s === "missing")) {
    overallStatus = "not_ready";
  } else {
    overallStatus = "review_required";
  }

  return {
    categories,
    wallets,
    transactions,
    budgets,
    goals,
    holdings,
    priceSources,
    overallStatus,
  };
}
