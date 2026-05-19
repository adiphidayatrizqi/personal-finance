export type WalletType = "Bank" | "Cash" | "E-wallet" | "FX" | "Gold" | "Crypto" | "Stock" | "Custom";
export type AssetType = "Gold" | "Crypto" | "FX" | "Stock" | "Custom";
export type TxType = "income" | "expense" | "transfer" | "buy" | "sell";
export type CategoryKind = "expense" | "income" | "investment";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number; // in IDR base for non-FX/asset wallets; for FX/Gold/Crypto/Stock this is in units of the asset (informational)
  currency: string; // e.g. IDR, USD, SGD, XAU, BTC
  icon: string; // emoji
  color: string; // hex or oklch string
  archived: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  archived: boolean;
}

export interface BaseTx {
  id: string;
  type: TxType;
  date: string; // ISO
  notes?: string;
  createdAt: string;
}

export interface IncomeTx extends BaseTx { type: "income"; amount: number; walletId: string; categoryId: string; }
export interface ExpenseTx extends BaseTx { type: "expense"; amount: number; walletId: string; categoryId: string; }
export interface TransferTx extends BaseTx { type: "transfer"; amount: number; fromWalletId: string; toWalletId: string; }
export interface BuyTx extends BaseTx {
  type: "buy";
  amountPaid: number; // in cash wallet currency (typically IDR)
  fromWalletId: string;
  holdingId: string;
  quantity: number;
  pricePerUnit: number;
  fee?: number;
}
export interface SellTx extends BaseTx {
  type: "sell";
  quantity: number;
  holdingId: string;
  toWalletId: string;
  pricePerUnit: number;
  fee?: number;
}
export type Transaction = IncomeTx | ExpenseTx | TransferTx | BuyTx | SellTx;

export interface Holding {
  id: string;
  name: string;
  type: AssetType;
  symbol: string;
  quantity: number;
  unit: string;
  avgBuyPrice: number;
  // current price is read from PriceSource by symbol; fallback to this
  manualPrice?: number;
  linkedWalletId?: string;
}

export interface PriceSource {
  id: string;
  symbol: string;
  category: AssetType;
  price: number;
  currency: string;
  source: string; // "Manual"
  updatedAt: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  categoryId: string;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  walletId?: string;
  deadline?: string; // ISO date
}

export interface FinanceState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  holdings: Holding[];
  prices: PriceSource[];
  budgets: Budget[];
  goals: Goal[];
}
