import { createFileRoute } from "@tanstack/react-router";
import { Plus, TrendingUp, ArrowUpRight, ArrowDownRight, Coffee, Briefcase, Bitcoin, ArrowLeftRight as Swap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Overview,
});

const fmt = (n: number) =>
  "Rp" + Math.abs(n).toLocaleString("id-ID");

const allocations = [
  { label: "Gold & XAUT", value: 17960524, color: "oklch(0.72 0.15 75)" },
  { label: "Cash", value: 8000000, color: "oklch(0.55 0.21 260)" },
  { label: "FX", value: 3009936, color: "oklch(0.62 0.16 150)" },
  { label: "Crypto", value: 1053266, color: "oklch(0.65 0.18 30)" },
  { label: "Stocks", value: 0, color: "oklch(0.50 0.10 280)" },
];

const transactions = [
  { icon: Coffee, name: "Coffee", cat: "Food · GoPay", amount: -28000 },
  { icon: Briefcase, name: "Salary", cat: "Income · Superbank", amount: 8000000 },
  { icon: Bitcoin, name: "Buy BTC", cat: "Investment · Superbank", amount: -1000000 },
  { icon: Swap, name: "Transfer to USD Pocket", cat: "FX · Superbank", amount: -2000000, neutral: true },
];

function Overview() {
  const totalAlloc = allocations.reduce((s, a) => s + a.value, 0);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Hi, Adip 👋</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Your money, assets, and portfolio in one place
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl border-border bg-card h-10">
            <Plus className="h-4 w-4" /> Add Holding
          </Button>
          <Button className="rounded-xl h-10 bg-primary hover:bg-primary/90 shadow-soft">
            <Plus className="h-4 w-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Hero net worth */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-card mb-6">
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-3">
              Total Net Worth
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="num text-5xl lg:text-6xl font-semibold text-foreground">
                {fmt(30023726)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Updated today</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-success/10 text-success px-4 py-2 w-fit">
            <TrendingUp className="h-4 w-4" />
            <span className="num text-sm font-medium">+{fmt(423000)}</span>
            <span className="text-xs opacity-80">this month</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Cash & Bank" value={fmt(8000000)} sub="3 accounts" />
        <SummaryCard label="Investments" value={fmt(22023726)} sub="Gold, FX, Crypto" />
        <SummaryCard label="Monthly Spending" value={fmt(2450000)} sub="May 2026" tone="warning" />
        <SummaryCard
          label="Portfolio Gain/Loss"
          value={"+" + fmt(1250000)}
          sub="+4.27% all time"
          tone="success"
        />
      </div>

      {/* Two-col: Allocation + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Allocation */}
        <section className="lg:col-span-3 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Asset Allocation</h2>
              <p className="text-xs text-muted-foreground mt-1">Across all investment classes</p>
            </div>
            <span className="num text-sm text-muted-foreground">Total {fmt(totalAlloc)}</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted mb-6">
            {allocations.map((a) => {
              const pct = totalAlloc ? (a.value / totalAlloc) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={a.label}
                  style={{ width: `${pct}%`, background: a.color }}
                  title={a.label}
                />
              );
            })}
          </div>

          <ul className="space-y-1">
            {allocations.map((a) => {
              const pct = totalAlloc ? (a.value / totalAlloc) * 100 : 0;
              return (
                <li
                  key={a.label}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: a.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                    <span className="num text-xs text-muted-foreground">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <span className="num text-sm font-semibold text-foreground">
                    {fmt(a.value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Transactions */}
        <section className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground mt-1">Latest 4 entries</p>
            </div>
            <button className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <ul className="space-y-1">
            {transactions.map((t, i) => {
              const positive = t.amount > 0;
              const Icon = t.icon;
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.cat}</p>
                  </div>
                  <div
                    className={
                      "num text-sm font-semibold flex items-center gap-1 " +
                      (t.neutral
                        ? "text-foreground"
                        : positive
                          ? "text-success"
                          : "text-destructive")
                    }
                  >
                    {!t.neutral &&
                      (positive ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      ))}
                    {positive ? "+" : t.neutral ? "" : "-"}
                    {fmt(t.amount)}
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

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className={"num text-2xl font-semibold mt-3 " + toneClass}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
    </div>
  );
}
