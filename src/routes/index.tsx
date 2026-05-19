import { createFileRoute } from "@tanstack/react-router";
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance/store";
import { computeDashboard, fmtIDR, fmtPct, sortTransactionsDesc } from "@/lib/finance/compute";
import { TransactionDialog } from "@/components/transaction-dialog";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
  const { state, hydrated } = useFinance();
  const s = computeDashboard(state);

  const recent = sortTransactionsDesc(state.transactions).slice(0, 6);
  const walletById = (id: string) => state.wallets.find((w) => w.id === id);
  const catById = (id: string) => state.categories.find((c) => c.id === id);
  const holdingById = (id: string) => state.holdings.find((h) => h.id === id);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Hi, Adip 👋</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Your money, assets, and portfolio in one place</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl border-border bg-card h-10">
            <Link to="/portfolio"><Plus className="h-4 w-4" /> Add Holding</Link>
          </Button>
          <TransactionDialog trigger={
            <Button className="rounded-xl h-10 bg-primary hover:bg-primary/90 shadow-soft">
              <Plus className="h-4 w-4" /> Add Transaction
            </Button>
          } />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-card mb-6">
        <div aria-hidden className="absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-3">Total Net Worth</p>
            <span className="num text-5xl lg:text-6xl font-semibold text-foreground">{fmtIDR(s.netWorth)}</span>
            <p className="text-sm text-muted-foreground mt-3">Updated today</p>
          </div>
          <div className={"flex items-center gap-2 rounded-full px-4 py-2 w-fit " + (s.monthChange >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {s.monthChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="num text-sm font-medium">{s.monthChange >= 0 ? "+" : "-"}{fmtIDR(s.monthChange)}</span>
            <span className="text-xs opacity-80">this month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Cash & Bank" value={fmtIDR(s.cashTotal)} sub={`${state.wallets.filter(w => !w.archived && ["Bank","Cash","E-wallet"].includes(w.type)).length} accounts`} />
        <SummaryCard label="Investments" value={fmtIDR(s.investmentsTotal)} sub={`${state.holdings.length} holdings`} />
        <SummaryCard label="Monthly Spending" value={fmtIDR(s.monthlySpending)} sub={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} tone="warning" />
        <SummaryCard label="Portfolio Gain/Loss" value={(s.portfolioGainLoss >= 0 ? "+" : "-") + fmtIDR(s.portfolioGainLoss)} sub={fmtPct(s.portfolioGainPct) + " all time"} tone={s.portfolioGainLoss >= 0 ? "success" : "destructive"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Asset Allocation</h2>
              <p className="text-xs text-muted-foreground mt-1">Across all investment classes</p>
            </div>
            <span className="num text-sm text-muted-foreground">Total {fmtIDR(s.netWorth)}</span>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted mb-6">
            {s.allocation.map((a) => {
              const pct = s.netWorth ? (a.value / s.netWorth) * 100 : 0;
              if (pct === 0) return null;
              return <div key={a.label} style={{ width: `${pct}%`, background: a.color }} title={a.label} />;
            })}
          </div>

          {s.allocation.length === 0 && hydrated && (
            <p className="text-sm text-muted-foreground py-6 text-center">No allocations yet — add wallets and holdings to get started.</p>
          )}

          <ul className="space-y-1">
            {s.allocation.map((a) => {
              const pct = s.netWorth ? (a.value / s.netWorth) * 100 : 0;
              return (
                <li key={a.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                    <span className="num text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                  </div>
                  <span className="num text-sm font-semibold text-foreground">{fmtIDR(a.value)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground mt-1">Latest {recent.length} entries</p>
            </div>
            <Link to="/transactions" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          {recent.length === 0 && hydrated && (
            <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</p>
          )}
          <ul className="space-y-1">
            {recent.map((t) => {
              let name = "", sub = "", amount = 0, positive = false, neutral = false;
              if (t.type === "income") { name = catById(t.categoryId)?.name ?? "Income"; sub = `Income · ${walletById(t.walletId)?.name ?? ""}`; amount = t.amount; positive = true; }
              else if (t.type === "expense") { name = t.notes || catById(t.categoryId)?.name || "Expense"; sub = `${catById(t.categoryId)?.name ?? ""} · ${walletById(t.walletId)?.name ?? ""}`; amount = t.amount; }
              else if (t.type === "transfer") { name = t.notes || "Transfer"; sub = `${walletById(t.fromWalletId)?.name} → ${walletById(t.toWalletId)?.name}`; amount = t.amount; neutral = true; }
              else if (t.type === "buy") { name = `Buy ${holdingById(t.holdingId)?.name ?? "Asset"}`; sub = `Investment · ${walletById(t.fromWalletId)?.name ?? ""}`; amount = t.amountPaid; }
              else if (t.type === "sell") { name = `Sell ${holdingById(t.holdingId)?.name ?? "Asset"}`; sub = `Investment · ${walletById(t.toWalletId)?.name ?? ""}`; amount = t.quantity * t.pricePerUnit; positive = true; }
              const Icon = t.type === "transfer" ? ArrowLeftRight : t.type === "buy" || t.type === "sell" ? Coins : positive ? ArrowUpRight : ArrowDownRight;
              return (
                <li key={t.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub}</p>
                  </div>
                  <div className={"num text-sm font-semibold " + (neutral ? "text-foreground" : positive ? "text-success" : "text-destructive")}>
                    {neutral ? "" : positive ? "+" : "-"}{fmtIDR(amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "success" | "warning" | "destructive" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className={"num text-2xl font-semibold mt-3 " + toneClass}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
    </div>
  );
}
