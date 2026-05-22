import type { Transaction, Wallet, Category } from "../finance/types";
import { fetchTransactions, createTransaction } from "./finance-service";

export interface MigrationResult {
  totalCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  skippedMissingReferenceCount: number;
  skippedUnsupportedCount: number;
  errors: string[];
}

export async function migrateTransactionsToSupabase(
  localTransactions: Transaction[],
  localWallets: Wallet[],
  localCategories: Category[]
): Promise<MigrationResult> {
  // Fetch existing data from Supabase
  const existingTransactions = await fetchTransactions();
  const existingWallets = await (await import("./finance-service")).fetchWallets();
  const existingCategories = await (await import("./finance-service")).fetchCategories();

  // Create mapping maps for wallets and categories
  const walletMap = new Map<string, string>(); // local key -> Supabase ID
  for (const localWallet of localWallets) {
    const key = `${localWallet.name}|${localWallet.type}|${localWallet.currency}`;
    const supabaseWallet = existingWallets.find(
      (w) => `${w.name}|${w.type}|${w.currency}` === key
    );
    if (supabaseWallet) {
      walletMap.set(localWallet.id, supabaseWallet.id);
    }
  }

  const categoryMap = new Map<string, string>(); // local ID -> Supabase ID
  for (const localCategory of localCategories) {
    const key = `${localCategory.name}|${localCategory.kind}`;
    const supabaseCategory = existingCategories.find(
      (c) => `${c.name}|${c.kind}` === key
    );
    if (supabaseCategory) {
      categoryMap.set(localCategory.id, supabaseCategory.id);
    }
  }

  // Create a set of existing transaction keys for duplicate detection
  const existingTxKeys = new Set(
    existingTransactions.map((tx) => {
      // Create a stable key for comparison
      const parts = [
        tx.type,
        tx.date,
        tx.notes || "",
      ];
      
      if (tx.type === "income" || tx.type === "expense") {
        parts.push(String(tx.amount), tx.walletId, tx.categoryId);
      } else if (tx.type === "transfer") {
        parts.push(String(tx.amount), tx.fromWalletId, tx.toWalletId);
      } else if (tx.type === "buy") {
        parts.push(String(tx.amountPaid), tx.fromWalletId, tx.holdingId, String(tx.quantity), String(tx.pricePerUnit));
      } else if (tx.type === "sell") {
        parts.push(String(tx.quantity), tx.holdingId, tx.toWalletId, String(tx.pricePerUnit));
      }
      
      return parts.join("|");
    })
  );

  let insertedCount = 0;
  let skippedDuplicateCount = 0;
  let skippedMissingReferenceCount = 0;
  let skippedUnsupportedCount = 0;
  const errors: string[] = [];

  for (const localTx of localTransactions) {
    // Check for unsupported transaction types
    if (localTx.type === "buy" || localTx.type === "sell") {
      skippedUnsupportedCount++;
      continue;
    }

    // Map wallet and category references
    let mappedTx: Transaction;
    try {
      if (localTx.type === "income") {
        const supabaseWalletId = walletMap.get(localTx.walletId);
        const supabaseCategoryId = categoryMap.get(localTx.categoryId);
        
        if (!supabaseWalletId || !supabaseCategoryId) {
          skippedMissingReferenceCount++;
          errors.push(
            `Skipped income transaction: missing wallet (${localTx.walletId}) or category (${localTx.categoryId}) reference`
          );
          continue;
        }

        mappedTx = {
          ...localTx,
          walletId: supabaseWalletId,
          categoryId: supabaseCategoryId,
        };
      } else if (localTx.type === "expense") {
        const supabaseWalletId = walletMap.get(localTx.walletId);
        const supabaseCategoryId = categoryMap.get(localTx.categoryId);
        
        if (!supabaseWalletId || !supabaseCategoryId) {
          skippedMissingReferenceCount++;
          errors.push(
            `Skipped expense transaction: missing wallet (${localTx.walletId}) or category (${localTx.categoryId}) reference`
          );
          continue;
        }

        mappedTx = {
          ...localTx,
          walletId: supabaseWalletId,
          categoryId: supabaseCategoryId,
        };
      } else if (localTx.type === "transfer") {
        const supabaseFromWalletId = walletMap.get(localTx.fromWalletId);
        const supabaseToWalletId = walletMap.get(localTx.toWalletId);
        
        if (!supabaseFromWalletId || !supabaseToWalletId) {
          skippedMissingReferenceCount++;
          errors.push(
            `Skipped transfer transaction: missing from wallet (${localTx.fromWalletId}) or to wallet (${localTx.toWalletId}) reference`
          );
          continue;
        }

        mappedTx = {
          ...localTx,
          fromWalletId: supabaseFromWalletId,
          toWalletId: supabaseToWalletId,
        };
      } else {
        skippedUnsupportedCount++;
        continue;
      }

      // Check for duplicates
      const parts = [
        mappedTx.type,
        mappedTx.date,
        mappedTx.notes || "",
      ];
      
      if (mappedTx.type === "income" || mappedTx.type === "expense") {
        parts.push(String(mappedTx.amount), mappedTx.walletId, mappedTx.categoryId);
      } else if (mappedTx.type === "transfer") {
        parts.push(String(mappedTx.amount), mappedTx.fromWalletId, mappedTx.toWalletId);
      }
      
      const txKey = parts.join("|");
      
      if (existingTxKeys.has(txKey)) {
        skippedDuplicateCount++;
        continue;
      }

      // Insert transaction
      await createTransaction(mappedTx);
      insertedCount++;
      existingTxKeys.add(txKey); // Prevent duplicates within the same batch
    } catch (error) {
      errors.push(
        `Failed to migrate transaction ${localTx.id}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    totalCount: localTransactions.length,
    insertedCount,
    skippedDuplicateCount,
    skippedMissingReferenceCount,
    skippedUnsupportedCount,
    errors,
  };
}
