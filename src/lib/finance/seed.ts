import type { FinanceState } from "./types";

const now = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

export function seedState(): FinanceState {
  const wSuperbank = { id: id(), name: "Superbank", type: "Bank" as const, initialBalance: 5000000, currency: "IDR", icon: "🏦", color: "#3b82f6", archived: false, createdAt: now() };
  const wGopay = { id: id(), name: "GoPay", type: "E-wallet" as const, initialBalance: 500000, currency: "IDR", icon: "📱", color: "#10b981", archived: false, createdAt: now() };
  const wCash = { id: id(), name: "Cash", type: "Cash" as const, initialBalance: 2500000, currency: "IDR", icon: "💵", color: "#6b7280", archived: false, createdAt: now() };
  const wUsd = { id: id(), name: "USD Pocket", type: "FX" as const, initialBalance: 113.19, currency: "USD", icon: "💵", color: "#0ea5e9", archived: false, createdAt: now() };
  const wSgd = { id: id(), name: "SGD Pocket", type: "FX" as const, initialBalance: 72.48, currency: "SGD", icon: "💵", color: "#ef4444", archived: false, createdAt: now() };
  const wGold = { id: id(), name: "Tring Emas", type: "Gold" as const, initialBalance: 5, currency: "XAU", icon: "🥇", color: "#f59e0b", archived: false, createdAt: now() };
  const wBtc = { id: id(), name: "BTC Wallet", type: "Crypto" as const, initialBalance: 0.0007749, currency: "BTC", icon: "₿", color: "#f97316", archived: false, createdAt: now() };

  const expCats = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Family", "Subscription", "Miscellaneous"];
  const incCats = ["Salary", "Bonus", "Cashback", "Gift", "Other Income"];
  const invCats = ["Gold", "FX", "Crypto", "Stock"];

  const categories = [
    ...expCats.map((n) => ({ id: id(), name: n, kind: "expense" as const, icon: "💸", archived: false })),
    ...incCats.map((n) => ({ id: id(), name: n, kind: "income" as const, icon: "💰", archived: false })),
    ...invCats.map((n) => ({ id: id(), name: n, kind: "investment" as const, icon: "📈", archived: false })),
  ];

  const findExp = (n: string) => categories.find((c) => c.name === n && c.kind === "expense")!.id;
  const findInc = (n: string) => categories.find((c) => c.name === n && c.kind === "income")!.id;

  const hGold = { id: id(), name: "Tring Emas", type: "Gold" as const, symbol: "EMAS", quantity: 5, unit: "gram", avgBuyPrice: 2400000, linkedWalletId: wGold.id };
  const hXaut = { id: id(), name: "XAUT", type: "Gold" as const, symbol: "XAUT", quantity: 0.06235347, unit: "token", avgBuyPrice: 78000000, linkedWalletId: wGold.id };
  const hUsd = { id: id(), name: "USD Pocket", type: "FX" as const, symbol: "USD/IDR", quantity: 113.19, unit: "USD", avgBuyPrice: 17500, linkedWalletId: wUsd.id };
  const hSgd = { id: id(), name: "SGD Pocket", type: "FX" as const, symbol: "SGD/IDR", quantity: 72.48, unit: "SGD", avgBuyPrice: 13700, linkedWalletId: wSgd.id };
  const hBtc = { id: id(), name: "BTC", type: "Crypto" as const, symbol: "BTC", quantity: 0.0007749, unit: "BTC", avgBuyPrice: 1300000000, linkedWalletId: wBtc.id };

  const prices = [
    { id: id(), symbol: "EMAS", category: "Gold" as const, price: 2587000, currency: "IDR", source: "Manual", updatedAt: now() },
    { id: id(), symbol: "USD/IDR", category: "FX" as const, price: 17725, currency: "IDR", source: "Manual", updatedAt: now() },
    { id: id(), symbol: "SGD/IDR", category: "FX" as const, price: 13847.17, currency: "IDR", source: "Manual", updatedAt: now() },
    { id: id(), symbol: "BTC", category: "Crypto" as const, price: 1359227800, currency: "IDR", source: "Manual", updatedAt: now() },
    { id: id(), symbol: "XAUT", category: "Gold" as const, price: 80597347.5, currency: "IDR", source: "Manual", updatedAt: now() },
  ];

  const today = new Date();
  const iso = (d: Date) => d.toISOString();
  const day = (offset: number) => { const d = new Date(today); d.setDate(d.getDate() - offset); return iso(d); };

  const transactions = [
    { id: id(), type: "expense" as const, amount: 28000, walletId: wGopay.id, categoryId: findExp("Food"), date: day(0), notes: "Coffee", createdAt: now() },
    { id: id(), type: "income" as const, amount: 8000000, walletId: wSuperbank.id, categoryId: findInc("Salary"), date: day(1), notes: "Monthly salary", createdAt: now() },
    { id: id(), type: "expense" as const, amount: 450000, walletId: wSuperbank.id, categoryId: findExp("Bills"), date: day(2), notes: "Electricity", createdAt: now() },
    { id: id(), type: "expense" as const, amount: 175000, walletId: wGopay.id, categoryId: findExp("Transport"), date: day(3), notes: "Grab" , createdAt: now() },
    { id: id(), type: "expense" as const, amount: 320000, walletId: wSuperbank.id, categoryId: findExp("Subscription"), date: day(4), notes: "Streaming", createdAt: now() },
    { id: id(), type: "transfer" as const, amount: 2000000, fromWalletId: wSuperbank.id, toWalletId: wUsd.id, date: day(5), notes: "Transfer to USD Pocket", createdAt: now() },
  ];

  const month = today.toISOString().slice(0, 7);
  const budgets = [
    { id: id(), month, categoryId: findExp("Food"), amount: 1500000 },
    { id: id(), month, categoryId: findExp("Transport"), amount: 800000 },
    { id: id(), month, categoryId: findExp("Bills"), amount: 1200000 },
    { id: id(), month, categoryId: findExp("Subscription"), amount: 500000 },
  ];

  const goals = [
    { id: id(), name: "Emergency Fund", target: 30000000, current: 8000000, walletId: wSuperbank.id },
    { id: id(), name: "USD Saving", target: 5000, current: 113.19, walletId: wUsd.id },
    { id: id(), name: "New Laptop", target: 25000000, current: 4500000 },
    { id: id(), name: "Investment Target", target: 100000000, current: 22000000 },
  ];

  return {
    wallets: [wSuperbank, wGopay, wCash, wUsd, wSgd, wGold, wBtc],
    categories,
    transactions,
    holdings: [hGold, hXaut, hUsd, hSgd, hBtc],
    prices,
    budgets,
    goals,
  };
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
