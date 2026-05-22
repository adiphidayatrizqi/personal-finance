import type { Holding, PriceSource, Wallet } from "../finance/types";
import { fetchHoldings, createHolding, fetchPriceSources, createPriceSource } from "./finance-service";

export interface HoldingMigrationResult {
  totalCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  warningCount: number;
  errors: string[];
}

export interface PriceSourceMigrationResult {
  totalCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  errors: string[];
}

export async function migrateHoldingsToSupabase(
  localHoldings: Holding[],
  localWallets: Wallet[]
): Promise<HoldingMigrationResult> {
  // Fetch existing data from Supabase
  const existingHoldings = await fetchHoldings();
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

  // Create a set of existing holding keys for duplicate detection
  const existingHoldingKeys = new Set(
    existingHoldings.map((h) => `${h.name}|${h.type}|${h.symbol}|${h.unit}`)
  );

  let insertedCount = 0;
  let skippedDuplicateCount = 0;
  let warningCount = 0;
  const errors: string[] = [];

  for (const localHolding of localHoldings) {
    // Map linked wallet reference if present
    let supabaseLinkedWalletId: string | undefined;
    if (localHolding.linkedWalletId) {
      supabaseLinkedWalletId = walletMap.get(localHolding.linkedWalletId);
      if (!supabaseLinkedWalletId) {
        warningCount++;
        // Still insert the holding, but with null linked_wallet_id
      }
    }

    // Check for duplicates
    const holdingKey = `${localHolding.name}|${localHolding.type}|${localHolding.symbol}|${localHolding.unit}`;
    if (existingHoldingKeys.has(holdingKey)) {
      skippedDuplicateCount++;
      continue;
    }

    // Insert holding with mapped wallet ID (or null if missing)
    try {
      const mappedHolding: Holding = {
        ...localHolding,
        linkedWalletId: supabaseLinkedWalletId,
      };
      await createHolding(mappedHolding);
      insertedCount++;
      existingHoldingKeys.add(holdingKey);
    } catch (error) {
      errors.push(
        `Failed to migrate holding: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    totalCount: localHoldings.length,
    insertedCount,
    skippedDuplicateCount,
    warningCount,
    errors,
  };
}

export async function migratePriceSourcesToSupabase(
  localPriceSources: PriceSource[]
): Promise<PriceSourceMigrationResult> {
  // Fetch existing data from Supabase
  const existingPriceSources = await fetchPriceSources();

  // Create a set of existing price source keys for duplicate detection
  const existingPriceSourceKeys = new Set(
    existingPriceSources.map((p) => `${p.symbol}|${p.category}|${p.currency}|${p.source}`)
  );

  let insertedCount = 0;
  let skippedDuplicateCount = 0;
  const errors: string[] = [];

  for (const localPriceSource of localPriceSources) {
    // Check for duplicates
    const priceSourceKey = `${localPriceSource.symbol}|${localPriceSource.category}|${localPriceSource.currency}|${localPriceSource.source}`;
    if (existingPriceSourceKeys.has(priceSourceKey)) {
      skippedDuplicateCount++;
      continue;
    }

    // Insert price source
    try {
      await createPriceSource(localPriceSource);
      insertedCount++;
      existingPriceSourceKeys.add(priceSourceKey);
    } catch (error) {
      errors.push(
        `Failed to migrate price source: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    totalCount: localPriceSources.length,
    insertedCount,
    skippedDuplicateCount,
    errors,
  };
}
