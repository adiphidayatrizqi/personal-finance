import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/lib/finance/store";
import { fmtIDR, sortTransactionsDesc } from "@/lib/finance/compute";
import { formatDateTimeSmartID } from "@/lib/finance/format";
import { TransactionDialog } from "@/components/transaction-dialog";
import type { Transaction } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Savvr" }] }),
  component: Page,
});

function Page() {
  const { state, setTransactions, hydrated } = useFinance();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const walletById = (id: string) => state.wallets.find((w) => w.id === id);
  const catById = (id: string) => state.categories.find((c) => c.id === id);
  const holdingById = (id: string) => state.holdings.find((h) => h.id === id);

  const filtered = useMemo(() => {
    const arr = state.transactions
      .filter((t) => filterType === "all" || t.type === filterType)
      .filter((t) => {
        if (filterWallet === "all") return true;
        if (t.type === "income" || t.type === "expense") return t.walletId === filterWallet;
        if (t.type === "transfer") return t.fromWalletId === filterWallet || t.toWalletId === filterWallet;
        if (t.type === "buy") return t.fromWalletId === filterWallet;
        if (t.type === "sell") return t.toWalletId === filterWallet;
        return false;
      })
      .filter((t) => {
        if (filterCat === "all") return true;
        return (t.type === "income" || t.type === "expense") && t.categoryId === filterCat;
      })
      .filter((t) => !fromDate || t.date >= fromDate)
      .filter((t) => !toDate || t.date <= toDate + "T23:59:59")
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (t.notes ?? "").toLowerCase().includes(q)
          || (t.type === "income" || t.type === "expense" ? (catById(t.categoryId)?.name.toLowerCase().includes(q) ?? false) : false);
      });
    return sortTransactionsDesc(arr);
  }, [state.transactions, search, filterType, filterWallet, filterCat, fromDate, toDate]);

  const describe = (t: Transaction) => {
    let name = "", sub = "", amount = 0, positive = false, neutral = false;
    if (t.type === "income") { name = t.notes || catById(t.categoryId)?.name || "Income"; sub = `Income · ${walletById(t.walletId)?.name ?? ""}`; amount = t.amount; positive = true; }
    else if (t.type === "expense") { name = t.notes || catById(t.categoryId)?.name || "Expense"; sub = `${catById(t.categoryId)?.name ?? ""} · ${walletById(t.walletId)?.name ?? ""}`; amount = t.amount; }
    else if (t.type === "transfer") { name = t.notes || "Transfer"; sub = `${walletById(t.fromWalletId)?.name} → ${walletById(t.toWalletId)?.name}`; amount = t.amount; neutral = true; }
    else if (t.type === "buy") { name = `Buy ${holdingById(t.holdingId)?.name ?? ""}`; sub = `${t.quantity} @ ${fmtIDR(t.pricePerUnit)} · ${walletById(t.fromWalletId)?.name ?? ""}`; amount = t.amountPaid; }
    else if (t.type === "sell") { name = `Sell ${holdingById(t.holdingId)?.name ?? ""}`; sub = `${t.quantity} @ ${fmtIDR(t.pricePerUnit)} · ${walletById(t.toWalletId)?.name ?? ""}`; amount = t.quantity * t.pricePerUnit; positive = true; }
    const Icon = t.type === "transfer" ? ArrowLeftRight : t.type === "buy" || t.type === "sell" ? Coins : positive ? ArrowUpRight : ArrowDownRight;
    return { name, sub, amount, positive, neutral, Icon };
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1.5">All income, expenses, transfers and trades</p>
        </div>
        <Button className="rounded-xl" onClick={() => { setEditing(null); setOpenDialog(true); }}>
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search notes or category" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterWallet} onValueChange={setFilterWallet}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wallets</SelectItem>
              {state.wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {state.categories.filter(c => !c.archived).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {filtered.length === 0 && hydrated && (
          <p className="text-sm text-muted-foreground py-12 text-center">No transactions match your filters.</p>
        )}
        <ul>
          {filtered.map((t) => {
            const d = describe(t);
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-accent/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <d.Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.sub} · {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className={"num text-sm font-semibold " + (d.neutral ? "text-foreground" : d.positive ? "text-success" : "text-destructive")}>
                  {d.neutral ? "" : d.positive ? "+" : "-"}{fmtIDR(d.amount)}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpenDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (!confirm("Delete this transaction?")) return;
                    setTransactions((arr) => arr.filter((x) => x.id !== t.id));
                    toast.success("Deleted");
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <TransactionDialog key={editing?.id ?? "new"} editing={editing ?? undefined} open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
}
