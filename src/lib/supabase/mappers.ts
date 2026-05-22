import type { Wallet, Category, Transaction, Holding, PriceSource, Budget, Goal } from "../finance/types";

// Helper to safely parse numeric values (Supabase numeric may come as strings)
function safeParseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to safely parse optional numeric values
function safeParseOptionalNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
}

// Helper to safely parse optional string values
function safeParseOptionalString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return value;
}

// ==================== WALLETS ====================

export interface WalletRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  initial_balance: string | number;
  currency: string;
  icon: string;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletInsertRow {
  name: string;
  type: string;
  initial_balance: number;
  currency: string;
  icon: string;
  color: string;
  archived: boolean;
}

export function walletRowToModel(row: WalletRow): Wallet {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Wallet["type"],
    initialBalance: safeParseNumber(row.initial_balance),
    currency: row.currency,
    icon: row.icon,
    color: row.color,
    archived: row.archived,
    createdAt: row.created_at,
  };
}

export function walletModelToInsertRow(model: Wallet): WalletInsertRow {
  return {
    name: model.name,
    type: model.type,
    initial_balance: model.initialBalance,
    currency: model.currency,
    icon: model.icon,
    color: model.color,
    archived: model.archived,
  };
}

// ==================== CATEGORIES ====================

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  kind: string;
  icon: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsertRow {
  name: string;
  kind: string;
  icon: string;
  archived: boolean;
}

export function categoryRowToModel(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as Category["kind"],
    icon: row.icon,
    archived: row.archived,
  };
}

export function categoryModelToInsertRow(model: Category): CategoryInsertRow {
  return {
    name: model.name,
    kind: model.kind,
    icon: model.icon,
    archived: model.archived,
  };
}

// ==================== TRANSACTIONS ====================

export interface TransactionRow {
  id: string;
  user_id: string;
  type: string;
  date: string;
  notes: string | null;
  amount: string | number | null;
  category_id: string | null;
  source_wallet_id: string | null;
  destination_wallet_id: string | null;
  holding_id: string | null;
  quantity: string | number | null;
  price_per_unit: string | number | null;
  fee: string | number | null;
  amount_paid: string | number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInsertRow {
  type: string;
  date: string;
  notes?: string;
  amount?: number;
  category_id?: string;
  source_wallet_id?: string;
  destination_wallet_id?: string;
  holding_id?: string;
  quantity?: number;
  price_per_unit?: number;
  fee?: number;
  amount_paid?: number;
}

export function transactionRowToModel(row: TransactionRow): Transaction {
  const base = {
    id: row.id,
    type: row.type as Transaction["type"],
    date: row.date,
    notes: safeParseOptionalString(row.notes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  switch (row.type) {
    case "income":
      return {
        ...base,
        type: "income",
        amount: safeParseNumber(row.amount),
        walletId: row.destination_wallet_id!,
        categoryId: row.category_id!,
      };
    case "expense":
      return {
        ...base,
        type: "expense",
        amount: safeParseNumber(row.amount),
        walletId: row.source_wallet_id!,
        categoryId: row.category_id!,
      };
    case "transfer":
      return {
        ...base,
        type: "transfer",
        amount: safeParseNumber(row.amount),
        fromWalletId: row.source_wallet_id!,
        toWalletId: row.destination_wallet_id!,
      };
    case "buy":
      return {
        ...base,
        type: "buy",
        amountPaid: safeParseNumber(row.amount_paid),
        fromWalletId: row.source_wallet_id!,
        holdingId: row.holding_id!,
        quantity: safeParseNumber(row.quantity),
        pricePerUnit: safeParseNumber(row.price_per_unit),
        fee: safeParseOptionalNumber(row.fee),
      };
    case "sell":
      return {
        ...base,
        type: "sell",
        quantity: safeParseNumber(row.quantity),
        holdingId: row.holding_id!,
        toWalletId: row.destination_wallet_id!,
        pricePerUnit: safeParseNumber(row.price_per_unit),
        fee: safeParseOptionalNumber(row.fee),
      };
    default:
      // Should never happen with proper check constraints
      throw new Error(`Unknown transaction type: ${row.type}`);
  }
}

export function transactionModelToInsertRow(model: Transaction): TransactionInsertRow {
  const base: TransactionInsertRow = {
    type: model.type,
    date: model.date,
    notes: model.notes,
  };

  switch (model.type) {
    case "income":
      return {
        ...base,
        amount: model.amount,
        category_id: model.categoryId,
        destination_wallet_id: model.walletId,
      };
    case "expense":
      return {
        ...base,
        amount: model.amount,
        category_id: model.categoryId,
        source_wallet_id: model.walletId,
      };
    case "transfer":
      return {
        ...base,
        amount: model.amount,
        source_wallet_id: model.fromWalletId,
        destination_wallet_id: model.toWalletId,
      };
    case "buy":
      return {
        ...base,
        amount_paid: model.amountPaid,
        source_wallet_id: model.fromWalletId,
        holding_id: model.holdingId,
        quantity: model.quantity,
        price_per_unit: model.pricePerUnit,
        fee: model.fee,
      };
    case "sell":
      return {
        ...base,
        holding_id: model.holdingId,
        quantity: model.quantity,
        destination_wallet_id: model.toWalletId,
        price_per_unit: model.pricePerUnit,
        fee: model.fee,
      };
  }
}

// ==================== HOLDINGS ====================

export interface HoldingRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  symbol: string;
  quantity: string | number;
  unit: string;
  avg_buy_price: string | number;
  manual_price: string | number | null;
  linked_wallet_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HoldingInsertRow {
  name: string;
  type: string;
  symbol: string;
  quantity: number;
  unit: string;
  avg_buy_price: number;
  manual_price?: number;
  linked_wallet_id?: string;
}

export function holdingRowToModel(row: HoldingRow): Holding {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Holding["type"],
    symbol: row.symbol,
    quantity: safeParseNumber(row.quantity),
    unit: row.unit,
    avgBuyPrice: safeParseNumber(row.avg_buy_price),
    manualPrice: safeParseOptionalNumber(row.manual_price),
    linkedWalletId: safeParseOptionalString(row.linked_wallet_id),
  };
}

export function holdingModelToInsertRow(model: Holding): HoldingInsertRow {
  return {
    name: model.name,
    type: model.type,
    symbol: model.symbol,
    quantity: model.quantity,
    unit: model.unit,
    avg_buy_price: model.avgBuyPrice,
    manual_price: model.manualPrice,
    linked_wallet_id: model.linkedWalletId,
  };
}

// ==================== PRICE SOURCES ====================

export interface PriceSourceRow {
  id: string;
  user_id: string;
  symbol: string;
  category: string;
  price: string | number;
  currency: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface PriceSourceInsertRow {
  symbol: string;
  category: string;
  price: number;
  currency: string;
  source: string;
}

export function priceSourceRowToModel(row: PriceSourceRow): PriceSource {
  return {
    id: row.id,
    symbol: row.symbol,
    category: row.category as PriceSource["category"],
    price: safeParseNumber(row.price),
    currency: row.currency,
    source: row.source,
    updatedAt: row.updated_at,
  };
}

export function priceSourceModelToInsertRow(model: PriceSource): PriceSourceInsertRow {
  return {
    symbol: model.symbol,
    category: model.category,
    price: model.price,
    currency: model.currency,
    source: model.source,
  };
}

// ==================== BUDGETS ====================

export interface BudgetRow {
  id: string;
  user_id: string;
  month: string;
  category_id: string;
  amount: string | number;
  created_at: string;
  updated_at: string;
}

export interface BudgetInsertRow {
  month: string;
  category_id: string;
  amount: number;
}

export function budgetRowToModel(row: BudgetRow): Budget {
  return {
    id: row.id,
    month: row.month,
    categoryId: row.category_id,
    amount: safeParseNumber(row.amount),
  };
}

export function budgetModelToInsertRow(model: Budget): BudgetInsertRow {
  return {
    month: model.month,
    category_id: model.categoryId,
    amount: model.amount,
  };
}

// ==================== GOALS ====================

export interface GoalRow {
  id: string;
  user_id: string;
  name: string;
  target: string | number;
  current: string | number;
  wallet_id: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalInsertRow {
  name: string;
  target: number;
  current: number;
  wallet_id?: string;
  deadline?: string;
}

export function goalRowToModel(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    target: safeParseNumber(row.target),
    current: safeParseNumber(row.current),
    walletId: safeParseOptionalString(row.wallet_id),
    deadline: safeParseOptionalString(row.deadline),
  };
}

export function goalModelToInsertRow(model: Goal): GoalInsertRow {
  return {
    name: model.name,
    target: model.target,
    current: model.current,
    wallet_id: model.walletId,
    deadline: model.deadline,
  };
}
