import type { Category } from "../finance/types";
import { fetchCategories, createCategory } from "./finance-service";

export interface MigrationResult {
  insertedCount: number;
  skippedCount: number;
  totalCount: number;
}

export async function migrateCategoriesToSupabase(
  localCategories: Category[]
): Promise<MigrationResult> {
  // Fetch existing categories from Supabase
  const existingCategories = await fetchCategories();

  // Create a set of existing category identifiers (name + kind)
  const existingKeys = new Set(
    existingCategories.map((cat) => `${cat.name}|${cat.kind}`)
  );

  let insertedCount = 0;
  let skippedCount = 0;

  // Insert only missing categories
  for (const localCat of localCategories) {
    const key = `${localCat.name}|${localCat.kind}`;

    if (existingKeys.has(key)) {
      // Category already exists, skip
      skippedCount++;
      continue;
    }

    // Insert new category
    await createCategory(localCat);
    insertedCount++;
    existingKeys.add(key); // Prevent duplicates within the same batch
  }

  return {
    insertedCount,
    skippedCount,
    totalCount: localCategories.length,
  };
}
