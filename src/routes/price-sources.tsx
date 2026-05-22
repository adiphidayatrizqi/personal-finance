import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/lib/finance/store";
import { uid } from "@/lib/finance/seed";
import { formatNumberID } from "@/lib/finance/format";
import type { PriceSource, AssetType } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/price-sources")({
  head: () => ({ meta: [{ title: "Price Sources — Worthly" }] }),
  component: Page,
});

const CATS: AssetType[] = ["Gold", "Crypto", "FX", "Stock", "Custom"];

function Page() {
  const { state, setPrices, hydrated } = useFinance();
  const [editing, setEditing] = useState<PriceSource | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Price Sources</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Manually maintained market prices for your holdings</p>
        </div>
        <Button className="rounded-xl" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Price
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
          <div className="col-span-3">Symbol</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-3 text-right">Price</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2 text-right">Updated</div>
        </div>
        {state.prices.length === 0 && hydrated && (
          <p className="text-sm text-muted-foreground py-12 text-center">No price sources yet.</p>
        )}
        {state.prices.map((p) => (
          <div key={p.id} className="grid grid-cols-12 px-5 py-4 border-b border-border last:border-0 items-center gap-2">
            <div className="col-span-6 md:col-span-3 font-semibold text-sm">{p.symbol}</div>
            <div className="col-span-6 md:col-span-2 text-sm text-muted-foreground">{p.category}</div>
            <div className="col-span-6 md:col-span-3 text-right num text-sm font-semibold">{p.currency} {formatNumberID(Math.round(p.price))}</div>
            <div className="col-span-3 md:col-span-2 text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3" />{p.source}</div>
            <div className="col-span-3 md:col-span-1 text-xs text-muted-foreground text-right">{new Date(p.updatedAt).toLocaleDateString()}</div>
            <div className="col-span-12 md:col-span-1 flex gap-1 md:justify-end">
              <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => {
                if (!confirm("Delete this price?")) return;
                setPrices((arr) => arr.filter((x) => x.id !== p.id));
                toast.success("Deleted");
              }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <PriceDialog open={open} onOpenChange={setOpen} editing={editing} onSave={(p) => {
        setPrices((arr) => editing ? arr.map((x) => x.id === p.id ? p : x) : [...arr, p]);
        toast.success("Saved");
        setOpen(false);
      }} />
    </div>
  );
}

function PriceDialog({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: PriceSource | null; onSave: (p: PriceSource) => void }) {
  const [symbol, setSymbol] = useState("");
  const [category, setCategory] = useState<AssetType>("Gold");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState("IDR");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setSymbol(editing.symbol); setCategory(editing.category); setPrice(String(editing.price)); setCurrency(editing.currency);
    } else {
      setSymbol(""); setCategory("Gold"); setPrice("0"); setCurrency("IDR");
    }
  }, [open, editing]);

  const submit = () => {
    if (!symbol) return toast.error("Symbol required");
    onSave({
      id: editing?.id ?? uid(),
      symbol, category, price: Number(price) || 0, currency, source: "Manual",
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Price" : "Add Price"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Symbol</Label><Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC, EMAS, USD/IDR" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Price</Label><Input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
