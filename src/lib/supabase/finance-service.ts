import { supabase } from "./client";
import type {
  Wallet,
  Category,
  Transaction,
  Holding,
  PriceSource,
  Budget,
  Goal,
} from "../finance/types";
import {
  walletRowToModel,
  walletModelToInsertRow,
  categoryRowToModel,
  categoryModelToInsertRow,
  transactionRowToModel,
  transactionModelToInsertRow,
  holdingRowToModel,
  holdingModelToInsertRow,
  priceSourceRowToModel,
  priceSourceModelToInsertRow,
  budgetRowToModel,
  budgetModelToInsertRow,
  goalRowToModel,
  goalModelToInsertRow,
} from "./mappers";

// ==================== AUTH HELPER ====================

export async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }

  if (!user) {
    throw new Error("No authenticated user found. Please log in.");
  }

  return user.id;
}

// ==================== WALLETS ====================

export async function fetchWallets(): Promise<Wallet[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch wallets: ${error.message}`);
  }

  return (data || []).map(walletRowToModel);
}

export async function createWallet(wallet: Wallet): Promise<Wallet> {
  const userId = await getCurrentUserId();
  const insertRow = walletModelToInsertRow(wallet);

  const { data, error } = await supabase
    .from("wallets")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create wallet: ${error.message}`);
  }

  return walletRowToModel(data);
}

export async function updateWallet(wallet: Wallet): Promise<Wallet> {
  const userId = await getCurrentUserId();
  const insertRow = walletModelToInsertRow(wallet);

  const { data, error } = await supabase
    .from("wallets")
    .update(insertRow)
    .eq("id", wallet.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update wallet: ${error.message}`);
  }

  return walletRowToModel(data);
}

export async function archiveWallet(walletId: string): Promise<Wallet> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("wallets")
    .update({ archived: true })
    .eq("id", walletId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to archive wallet: ${error.message}`);
  }

  return walletRowToModel(data);
}

export async function deleteWallet(walletId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", walletId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete wallet: ${error.message}`);
  }
}

// ==================== CATEGORIES ====================

export async function fetchCategories(): Promise<Category[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return (data || []).map(categoryRowToModel);
}

export async function createCategory(category: Category): Promise<Category> {
  const userId = await getCurrentUserId();
  const insertRow = categoryModelToInsertRow(category);

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return categoryRowToModel(data);
}

export async function updateCategory(category: Category): Promise<Category> {
  const userId = await getCurrentUserId();
  const insertRow = categoryModelToInsertRow(category);

  const { data, error } = await supabase
    .from("categories")
    .update(insertRow)
    .eq("id", category.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return categoryRowToModel(data);
}

export async function archiveCategory(categoryId: string): Promise<Category> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("categories")
    .update({ archived: true })
    .eq("id", categoryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to archive category: ${error.message}`);
  }

  return categoryRowToModel(data);
}

// ==================== TRANSACTIONS ====================

export async function fetchTransactions(): Promise<Transaction[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return (data || []).map(transactionRowToModel);
}

export async function createTransaction(
  transaction: Transaction
): Promise<Transaction> {
  const userId = await getCurrentUserId();
  const insertRow = transactionModelToInsertRow(transaction);

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return transactionRowToModel(data);
}

export async function updateTransaction(
  transaction: Transaction
): Promise<Transaction> {
  const userId = await getCurrentUserId();
  const insertRow = transactionModelToInsertRow(transaction);

  const { data, error } = await supabase
    .from("transactions")
    .update(insertRow)
    .eq("id", transaction.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return transactionRowToModel(data);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
}

// ==================== BUDGETS ====================

export async function fetchBudgets(): Promise<Budget[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }

  return (data || []).map(budgetRowToModel);
}

export async function createBudget(budget: Budget): Promise<Budget> {
  const userId = await getCurrentUserId();
  const insertRow = budgetModelToInsertRow(budget);

  const { data, error } = await supabase
    .from("budgets")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create budget: ${error.message}`);
  }

  return budgetRowToModel(data);
}

export async function updateBudget(budget: Budget): Promise<Budget> {
  const userId = await getCurrentUserId();
  const insertRow = budgetModelToInsertRow(budget);

  const { data, error } = await supabase
    .from("budgets")
    .update(insertRow)
    .eq("id", budget.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update budget: ${error.message}`);
  }

  return budgetRowToModel(data);
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete budget: ${error.message}`);
  }
}

// ==================== HOLDINGS ====================

export async function fetchHoldings(): Promise<Holding[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch holdings: ${error.message}`);
  }

  return (data || []).map(holdingRowToModel);
}

export async function createHolding(holding: Holding): Promise<Holding> {
  const userId = await getCurrentUserId();
  const insertRow = holdingModelToInsertRow(holding);

  const { data, error } = await supabase
    .from("holdings")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create holding: ${error.message}`);
  }

  return holdingRowToModel(data);
}

export async function updateHolding(holding: Holding): Promise<Holding> {
  const userId = await getCurrentUserId();
  const insertRow = holdingModelToInsertRow(holding);

  const { data, error } = await supabase
    .from("holdings")
    .update(insertRow)
    .eq("id", holding.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update holding: ${error.message}`);
  }

  return holdingRowToModel(data);
}

export async function deleteHolding(holdingId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("holdings")
    .delete()
    .eq("id", holdingId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete holding: ${error.message}`);
  }
}

// ==================== PRICE SOURCES ====================

export async function fetchPriceSources(): Promise<PriceSource[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("price_sources")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch price sources: ${error.message}`);
  }

  return (data || []).map(priceSourceRowToModel);
}

export async function createPriceSource(
  priceSource: PriceSource
): Promise<PriceSource> {
  const userId = await getCurrentUserId();
  const insertRow = priceSourceModelToInsertRow(priceSource);

  const { data, error } = await supabase
    .from("price_sources")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create price source: ${error.message}`);
  }

  return priceSourceRowToModel(data);
}

export async function updatePriceSource(
  priceSource: PriceSource
): Promise<PriceSource> {
  const userId = await getCurrentUserId();
  const insertRow = priceSourceModelToInsertRow(priceSource);

  const { data, error } = await supabase
    .from("price_sources")
    .update(insertRow)
    .eq("id", priceSource.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update price source: ${error.message}`);
  }

  return priceSourceRowToModel(data);
}

export async function deletePriceSource(priceSourceId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("price_sources")
    .delete()
    .eq("id", priceSourceId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete price source: ${error.message}`);
  }
}

// ==================== GOALS ====================

export async function fetchGoals(): Promise<Goal[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return (data || []).map(goalRowToModel);
}

export async function createGoal(goal: Goal): Promise<Goal> {
  const userId = await getCurrentUserId();
  const insertRow = goalModelToInsertRow(goal);

  const { data, error } = await supabase
    .from("goals")
    .insert({ ...insertRow, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return goalRowToModel(data);
}

export async function updateGoal(goal: Goal): Promise<Goal> {
  const userId = await getCurrentUserId();
  const insertRow = goalModelToInsertRow(goal);

  const { data, error } = await supabase
    .from("goals")
    .update(insertRow)
    .eq("id", goal.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return goalRowToModel(data);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
}
