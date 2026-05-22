import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/lib/finance/store";
import { uid } from "@/lib/finance/seed";
import { fmtIDR, fmtNum, fmtPct, holdingPrice, holdingQuantity } from "@/lib/finance/compute";
import type { Holding, AssetType } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Worthly" }] }),
  component: Page,
});

const ASSET_TYPES: AssetType[] = ["Gold", "Crypto", "FX", "Stock", "Custom"];

function Page() {
  const { state, createHolding, updateHolding, deleteHolding, hydrated } = useFinance();
  const [editing, setEditing] = useState<Holding | null>(null);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const rows = state.holdings.map((h) => {
    const qty = holdingQuantity(h, state.transactions);
    const price = holdingPrice(h, state.prices);
    const value = qty * price;
    const cost = qty * h.avgBuyPrice;
    const pnl = value - cost;
    const pct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { h, qty, price, value, cost, pnl, pct };
  });

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const handleSave = async (holding: Holding) => {
    setIsSaving(true);
    try {
      if (editing) {
        await updateHolding(holding);
        toast.success("Holding updated");
      } else {
        await createHolding(holding);
        toast.success("Holding added");
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save holding");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (holdingId: string) => {
    if (!confirm("Delete this holding?")) return;
    try {
      await deleteHolding(holdingId);
      toast.success("Holding deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete holding");
    }
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Your investment holdings and performance</p>
        </div>
        <Button className="rounded-xl" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Holding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Value" value={fmtIDR(totalValue)} />
        <StatCard label="Total Cost" value={fmtIDR(totalCost)} />
        <StatCard label="Gain / Loss" value={(totalPnl >= 0 ? "+" : "-") + fmtIDR(totalPnl)} sub={fmtPct(totalPct)} tone={totalPnl >= 0 ? "success" : "destructive"} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
          <div className="col-span-3">Asset</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Avg Cost</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Value / P&L</div>
          <div className="col-span-1"></div>
        </div>
        {rows.length === 0 && hydrated && (
          <p className="text-sm text-muted-foreground py-12 text-center">No holdings yet.</p>
        )}
        {rows.map(({ h, qty, price, value, pnl, pct }) => (
          <div key={h.id} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-0 items-center gap-2">
            <div className="col-span-12 md:col-span-3">
              <p className="text-sm font-semibold">{h.name}</p>
              <p className="text-xs text-muted-foreground">{h.type} · {h.symbol}</p>
            </div>
            <div className="col-span-4 md:col-span-2 text-left md:text-right num text-sm">{fmtNum(qty, 8)} <span className="text-xs text-muted-foreground">{h.unit}</span></div>
            <div className="col-span-4 md:col-span-2 text-left md:text-right num text-sm text-muted-foreground">{fmtIDR(h.avgBuyPrice)}</div>
            <div className="col-span-4 md:col-span-2 text-left md:text-right num text-sm">{fmtIDR(price)}</div>
            <div className="col-span-8 md:col-span-2 text-left md:text-right">
              <p className="num text-sm font-semibold">{fmtIDR(value)}</p>
              <p className={"num text-xs flex items-center gap-1 md:justify-end " + (pnl >= 0 ? "text-success" : "text-destructive")}>
                {pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {pnl >= 0 ? "+" : "-"}{fmtIDR(pnl)} ({fmtPct(pct)})
              </p>
            </div>
            <div className="col-span-4 md:col-span-1 flex gap-1 md:justify-end">
              <Button size="icon" variant="ghost" onClick={() => { setEditing(h); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(h.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <HoldingDialog open={open} onOpenChange={setOpen} editing={editing} onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "destructive" }) {
  const c = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className={"num text-2xl font-semibold mt-3 " + c}>{value}</p>
      {sub && <p className={"num text-xs mt-1 " + c}>{sub}</p>}
    </div>
  );
}

function HoldingDialog({ open, onOpenChange, editing, onSave, isSaving }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Holding | null; onSave: (h: Holding) => Promise<void>; isSaving: boolean }) {
  const { state } = useFinance();
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("Gold");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("");
  const [avgBuyPrice, setAvgBuyPrice] = useState("0");
  const [manualPrice, setManualPrice] = useState("");
  const [linkedWalletId, setLinkedWalletId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name); setType(editing.type); setSymbol(editing.symbol);
      setQuantity(String(editing.quantity)); setUnit(editing.unit); setAvgBuyPrice(String(editing.avgBuyPrice));
      setManualPrice(editing.manualPrice ? String(editing.manualPrice) : "");
      setLinkedWalletId(editing.linkedWalletId ?? "");
    } else {
      setName(""); setType("Gold"); setSymbol(""); setQuantity("0"); setUnit("gram"); setAvgBuyPrice("0"); setManualPrice(""); setLinkedWalletId("");
    }
  }, [open, editing]);

  const submit = async () => {
    if (!name || !symbol) return toast.error("Name and symbol required");
    const h: Holding = {
      id: editing?.id ?? uid(),
      name, type, symbol, quantity: Number(quantity) || 0, unit, avgBuyPrice: Number(avgBuyPrice) || 0,
      manualPrice: manualPrice ? Number(manualPrice) : undefined,
      linkedWalletId: linkedWalletId || undefined,
    };
    await onSave(h);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Holding" : "Add Holding"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Symbol / Price Source</Label><Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC, XAUT, USD/IDR" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Quantity</Label><Input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="gram, token, USD, shares" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Avg Buy Price</Label><Input type="number" step="any" value={avgBuyPrice} onChange={(e) => setAvgBuyPrice(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Manual Price (fallback)</Label><Input type="number" step="any" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Linked Wallet (optional)</Label>
            <Select value={linkedWalletId || "none"} onValueChange={(v) => setLinkedWalletId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {state.wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={submit} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
