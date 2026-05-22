import type { Budget, Goal, Category, Wallet } from "../finance/types";
import { fetchBudgets, createBudget, fetchGoals, createGoal } from "./finance-service";

export interface BudgetMigrationResult {
  totalCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  skippedMissingReferenceCount: number;
  errors: string[];
}

export interface GoalMigrationResult {
  totalCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  warningCount: number;
  errors: string[];
}

export async function migrateBudgetsToSupabase(
  localBudgets: Budget[],
  localCategories: Category[]
): Promise<BudgetMigrationResult> {
  // Fetch existing data from Supabase
  const existingBudgets = await fetchBudgets();
  const existingCategories = await (await import("./finance-service")).fetchCategories();

  // Create category map: local ID -> Supabase ID
  const categoryMap = new Map<string, string>();
  for (const localCategory of localCategories) {
    const key = `${localCategory.name}|${localCategory.kind}`;
    const supabaseCategory = existingCategories.find(
      (c) => `${c.name}|${c.kind}` === key
    );
    if (supabaseCategory) {
      categoryMap.set(localCategory.id, supabaseCategory.id);
    }
  }

  // Create a set of existing budget keys for duplicate detection
  const existingBudgetKeys = new Set(
    existingBudgets.map((b) => `${b.month}|${b.categoryId}`)
  );

  let insertedCount = 0;
  let skippedDuplicateCount = 0;
  let skippedMissingReferenceCount = 0;
  const errors: string[] = [];

  for (const localBudget of localBudgets) {
    // Map category reference
    const supabaseCategoryId = categoryMap.get(localBudget.categoryId);

    if (!supabaseCategoryId) {
      skippedMissingReferenceCount++;
      errors.push(
        `Skipped budget: missing category reference (${localBudget.categoryId})`
      );
      continue;
    }

    // Check for duplicates
    const budgetKey = `${localBudget.month}|${supabaseCategoryId}`;
    if (existingBudgetKeys.has(budgetKey)) {
      skippedDuplicateCount++;
      continue;
    }

    // Insert budget with mapped category ID
    try {
      const mappedBudget: Budget = {
        ...localBudget,
        categoryId: supabaseCategoryId,
      };
      await createBudget(mappedBudget);
      insertedCount++;
      existingBudgetKeys.add(budgetKey);
    } catch (error) {
      errors.push(
        `Failed to migrate budget: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    totalCount: localBudgets.length,
    insertedCount,
    skippedDuplicateCount,
    skippedMissingReferenceCount,
    errors,
  };
}

export async function migrateGoalsToSupabase(
  localGoals: Goal[],
  localWallets: Wallet[]
): Promise<GoalMigrationResult> {
  // Fetch existing data from Supabase
  const existingGoals = await fetchGoals();
  const existingWallets = await (await import("./finance-service")).fetchWallets();

  // Create wallet map: local ID -> Supabase ID
  const walletMap = new Map<string, string>();
  for (const localWallet of localWallets) {
    const key = `${localWallet.name}|${localWallet.type}|${localWallet.currency}`;
    const supabaseWallet = existingWallets.find(
      (w) => `${w.name}|${w.type}|${w.currency}` === key
    );
    if (supabaseWallet) {
      walletMap.set(localWallet.id, supabaseWallet.id);
    }
  }

  // Create a set of existing goal keys for duplicate detection
  const existingGoalKeys = new Set(
    existingGoals.map((g) => `${g.name}|${g.target}|${g.current}|${g.deadline || ""}`)
  );

  let insertedCount = 0;
  let skippedDuplicateCount = 0;
  let warningCount = 0;
  const errors: string[] = [];

  for (const localGoal of localGoals) {
    // Map wallet reference if present
    let supabaseWalletId: string | undefined;
    if (localGoal.walletId) {
      supabaseWalletId = walletMap.get(localGoal.walletId);
      if (!supabaseWalletId) {
        warningCount++;
        // Still insert the goal, but with null wallet_id
      }
    }

    // Check for duplicates
    const goalKey = `${localGoal.name}|${localGoal.target}|${localGoal.current}|${localGoal.deadline || ""}`;
    if (existingGoalKeys.has(goalKey)) {
      skippedDuplicateCount++;
      continue;
    }

    // Insert goal with mapped wallet ID (or null if missing)
    try {
      const mappedGoal: Goal = {
        ...localGoal,
        walletId: supabaseWalletId,
      };
      await createGoal(mappedGoal);
      insertedCount++;
      existingGoalKeys.add(goalKey);
    } catch (error) {
      errors.push(
        `Failed to migrate goal: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    totalCount: localGoals.length,
    insertedCount,
    skippedDuplicateCount,
    warningCount,
    errors,
  };
}
