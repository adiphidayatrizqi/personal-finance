import type { FinanceState, Wallet, Transaction, Holding, PriceSource } from "./types";

export const fmtIDR = (n: number) => "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID") + (n < 0 ? "" : "");
export const fmtIDRSigned = (n: number) => (n < 0 ? "-" : "") + "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");
export const fmtNum = (n: number, max = 6) => n.toLocaleString("en-US", { maximumFractionDigits: max });
export const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

export function priceOf(symbol: string, prices: PriceSource[]): number | undefined {
  return prices.find((p) => p.symbol === symbol)?.price;
}

// Wallet balance in its native unit (IDR for IDR wallets, USD for USD pocket, etc.)
export function walletBalance(wallet: Wallet, txs: Transaction[]): number {
  let bal = wallet.initialBalance;
  for (const t of txs) {
    if (t.type === "income" && t.walletId === wallet.id) bal += t.amount;
    else if (t.type === "expense" && t.walletId === wallet.id) bal -= t.amount;
    else if (t.type === "transfer") {
      if (t.fromWalletId === wallet.id) bal -= t.amount;
      if (t.toWalletId === wallet.id) bal += t.amount;
    } else if (t.type === "buy" && t.fromWalletId === wallet.id) {
      bal -= t.amountPaid + (t.fee ?? 0);
    } else if (t.type === "sell" && t.toWalletId === wallet.id) {
      bal += t.quantity * t.pricePerUnit - (t.fee ?? 0);
    }
  }
  return bal;
}

// Convert any wallet native balance to IDR using price sources
export function walletValueIDR(wallet: Wallet, balance: number, prices: PriceSource[]): number {
  if (wallet.currency === "IDR") return balance;
  // try direct symbol like USD/IDR, SGD/IDR, BTC, XAU, XAUT, EMAS
  const map: Record<string, string> = { USD: "USD/IDR", SGD: "SGD/IDR", XAU: "EMAS", BTC: "BTC" };
  const sym = map[wallet.currency] ?? wallet.currency;
  const p = priceOf(sym, prices);
  return p ? balance * p : balance;
}

export function holdingQuantity(holding: Holding, txs: Transaction[]): number {
  let q = holding.quantity;
  for (const t of txs) {
    if (t.type === "buy" && t.holdingId === holding.id) q += t.quantity;
    if (t.type === "sell" && t.holdingId === holding.id) q -= t.quantity;
  }
  return q;
}

export function holdingPrice(holding: Holding, prices: PriceSource[]): number {
  return priceOf(holding.symbol, prices) ?? holding.manualPrice ?? holding.avgBuyPrice;
}

export interface DashboardSummary {
  netWorth: number;
  cashTotal: number;
  investmentsTotal: number;
  monthlySpending: number;
  portfolioGainLoss: number;
  portfolioGainPct: number;
  monthChange: number;
  allocation: { label: string; value: number; color: string }[];
}

export function computeDashboard(s: FinanceState): DashboardSummary {
  const activeWallets = s.wallets.filter((w) => !w.archived);

  // Cash & Bank = IDR wallets (Bank/Cash/E-wallet)
  let cashTotal = 0;
  for (const w of activeWallets) {
    if (w.type === "Bank" || w.type === "Cash" || w.type === "E-wallet") {
      const bal = walletBalance(w, s.transactions);
      cashTotal += walletValueIDR(w, bal, s.prices);
    }
  }

  // Investments: holdings valued at current price (IDR)
  let investmentsTotal = 0;
  let totalCost = 0;
  const allocByType: Record<string, number> = {};
  for (const h of s.holdings) {
    const q = holdingQuantity(h, s.transactions);
    const p = holdingPrice(h, s.prices);
    const value = q * p;
    investmentsTotal += value;
    totalCost += q * h.avgBuyPrice;
    allocByType[h.type] = (allocByType[h.type] ?? 0) + value;
  }
  const portfolioGainLoss = investmentsTotal - totalCost;
  const portfolioGainPct = totalCost > 0 ? (portfolioGainLoss / totalCost) * 100 : 0;

  // FX wallets that aren't linked to a holding also count as investments-ish?
  // Per spec: investments = holdings. Cash bucket only IDR types. FX wallets without holdings: treat as FX allocation.
  let fxStandalone = 0;
  for (const w of activeWallets) {
    if (w.type === "FX" || w.type === "Gold" || w.type === "Crypto" || w.type === "Stock") {
      const linked = s.holdings.some((h) => h.linkedWalletId === w.id);
      if (linked) continue;
      const bal = walletBalance(w, s.transactions);
      const v = walletValueIDR(w, bal, s.prices);
      fxStandalone += v;
      const key = w.type === "FX" ? "FX" : w.type;
      allocByType[key] = (allocByType[key] ?? 0) + v;
    }
  }

  const netWorth = cashTotal + investmentsTotal + fxStandalone;

  // Monthly spending = expenses this month
  const ym = new Date().toISOString().slice(0, 7);
  let monthlySpending = 0;
  let monthIncome = 0;
  for (const t of s.transactions) {
    if (!t.date.startsWith(ym)) continue;
    if (t.type === "expense") monthlySpending += t.amount;
    if (t.type === "income") monthIncome += t.amount;
  }
  const monthChange = monthIncome - monthlySpending;

  // Cash also part of allocation
  if (cashTotal > 0) allocByType["Cash"] = cashTotal;

  const palette: Record<string, string> = {
    Gold: "oklch(0.72 0.15 75)",
    Cash: "oklch(0.55 0.21 260)",
    FX: "oklch(0.62 0.16 150)",
    Crypto: "oklch(0.65 0.18 30)",
    Stock: "oklch(0.50 0.10 280)",
    Custom: "oklch(0.60 0.08 200)",
  };
  const allocation = Object.entries(allocByType)
    .map(([label, value]) => ({ label, value, color: palette[label] ?? "oklch(0.6 0.05 260)" }))
    .sort((a, b) => b.value - a.value);

  return { netWorth, cashTotal, investmentsTotal, monthlySpending, portfolioGainLoss, portfolioGainPct, monthChange, allocation };
}

export function monthlySpendByCategory(s: FinanceState, month: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of s.transactions) {
    if (t.type !== "expense") continue;
    if (!t.date.startsWith(month)) continue;
    out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amount;
  }
  return out;
}
