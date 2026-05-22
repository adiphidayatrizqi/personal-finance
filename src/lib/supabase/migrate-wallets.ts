import type { Wallet } from "../finance/types";
import { fetchWallets, createWallet } from "./finance-service";

export interface MigrationResult {
  insertedCount: number;
  skippedCount: number;
  totalCount: number;
}

export async function migrateWalletsToSupabase(
  localWallets: Wallet[]
): Promise<MigrationResult> {
  // Fetch existing wallets from Supabase
  const existingWallets = await fetchWallets();

  // Create a set of existing wallet identifiers (name + type + currency)
  // Local IDs are random strings, not UUIDs, so we use composite key for deduplication
  const existingKeys = new Set(
    existingWallets.map((wallet) => `${wallet.name}|${wallet.type}|${wallet.currency}`)
  );

  let insertedCount = 0;
  let skippedCount = 0;

  // Insert only missing wallets
  for (const localWallet of localWallets) {
    const key = `${localWallet.name}|${localWallet.type}|${localWallet.currency}`;

    if (existingKeys.has(key)) {
      // Wallet already exists, skip
      skippedCount++;
      continue;
    }

    // Insert new wallet (Supabase will generate UUID)
    // We preserve all fields except id (let Supabase generate)
    await createWallet(localWallet);
    insertedCount++;
    existingKeys.add(key); // Prevent duplicates within the same batch
  }

  return {
    insertedCount,
    skippedCount,
    totalCount: localWallets.length,
  };
}
