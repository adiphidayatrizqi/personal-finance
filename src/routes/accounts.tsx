import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Archive, Trash2, Pencil, ArchiveRestore, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/lib/finance/store";
import { uid } from "@/lib/finance/seed";
import { walletBalance, walletValueIDR } from "@/lib/finance/compute";
import { formatIDR, formatNumberID } from "@/lib/finance/format";
import { NumberInputID } from "@/components/number-input";
import type { Wallet, WalletType } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Worthly" }] }),
  component: Page,
});

const WALLET_TYPES: WalletType[] = ["Bank", "Cash", "E-wallet", "FX", "Gold", "Crypto", "Stock", "Custom"];
const ICONS = ["🏦", "💵", "📱", "💳", "🥇", "₿", "📈", "💼", "🪙"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#6b7280"];

function Page() {
  const { state, setWallets, setTransactions, hydrated } = useFinance();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [adjustingWallet, setAdjustingWallet] = useState<Wallet | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const list = state.wallets.filter((w) => showArchived ? w.archived : !w.archived);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Manage your wallets, bank accounts, and asset wallets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Button className="rounded-xl" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Wallet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((w) => {
          const bal = walletBalance(w, state.transactions);
          const idr = walletValueIDR(w, bal, state.prices);
          return (
            <div key={w.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: w.color + "22", color: w.color }}>{w.icon}</div>
                  <div>
                    <p className="text-sm font-semibold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.type} · {w.currency}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(w); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { setAdjustingWallet(w); setAdjustOpen(true); }}><Scale className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    setWallets((arr) => arr.map((x) => x.id === w.id ? { ...x, archived: !x.archived } : x));
                    toast.success(w.archived ? "Unarchived" : "Archived");
                  }}>{w.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (!confirm("Delete this wallet? Related transactions will remain.")) return;
                    setWallets((arr) => arr.filter((x) => x.id !== w.id));
                    toast.success("Deleted");
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div>
                <p className="num text-2xl font-semibold">{w.currency === "IDR" ? formatIDR(bal) : formatNumberID(bal, 8) + " " + w.currency}</p>
                {w.currency !== "IDR" && <p className="num text-xs text-muted-foreground mt-1">≈ {formatIDR(idr)}</p>}
              </div>
            </div>
          );
        })}
        {list.length === 0 && hydrated && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No {showArchived ? "archived" : "active"} wallets.</p>
          </div>
        )}
      </div>

      <WalletDialog open={open} onOpenChange={setOpen} editing={editing} onSave={(w) => {
        setWallets((arr) => editing ? arr.map((x) => x.id === w.id ? w : x) : [...arr, w]);
        toast.success(editing ? "Wallet updated" : "Wallet added");
        setOpen(false);
      }} />
      <AdjustBalanceDialog open={adjustOpen} onOpenChange={setAdjustOpen} wallet={adjustingWallet} state={state} setTransactions={setTransactions} />
    </div>
  );
}

function WalletDialog({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Wallet | null; onSave: (w: Wallet) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("Bank");
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currency, setCurrency] = useState("IDR");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name); setType(editing.type); setInitialBalance(editing.initialBalance);
      setCurrency(editing.currency); setIcon(editing.icon); setColor(editing.color);
    } else {
      setName(""); setType("Bank"); setInitialBalance(0); setCurrency("IDR"); setIcon(ICONS[0]); setColor(COLORS[0]);
    }
  }, [open, editing]);

  const submit = () => {
    if (!name) return toast.error("Name required");
    const w: Wallet = {
      id: editing?.id ?? uid(),
      name, type, initialBalance: Number(initialBalance) || 0, currency, icon, color,
      archived: editing?.archived ?? false,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    onSave(w);
  };

  const isIDR = currency === "IDR";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Wallet" : "Add Wallet"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as WalletType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WALLET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Currency / Unit</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
          </div>
          <div className="grid gap-1.5">
            <Label>Initial Balance {isIDR ? "(Rp)" : `(${currency})`}</Label>
            <NumberInputID value={initialBalance} onChange={setInitialBalance} decimals={!isIDR} placeholder={isIDR ? "0" : "0,00"} />
          </div>
          <div className="grid gap-1.5"><Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button key={i} type="button" onClick={() => setIcon(i)} className={"h-10 w-10 rounded-xl border text-lg " + (icon === i ? "border-primary bg-primary/10" : "border-border")}>{i}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5"><Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={"h-8 w-8 rounded-full border-2 " + (color === c ? "border-foreground" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustBalanceDialog({ open, onOpenChange, wallet, state, setTransactions }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wallet: Wallet | null;
  state: any;
  setTransactions: (u: (items: any[]) => any[]) => void;
}) {
  const [newBalance, setNewBalance] = useState<number>(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !wallet) return;
    const bal = walletBalance(wallet, state.transactions);
    setNewBalance(bal);
    setNote("");
  }, [open, wallet, state.transactions]);

  if (!wallet) return null;

  const currentBalance = walletBalance(wallet, state.transactions);
  const isIDR = wallet.currency === "IDR";
  const difference = newBalance - currentBalance;

  const submit = () => {
    if (difference === 0) {
      toast.info("No balance change needed");
      onOpenChange(false);
      return;
    }

    const now = new Date().toISOString();
    const incomeCat = state.categories.find((c: any) => c.name === "Other Income" && c.kind === "income");
    const expenseCat = state.categories.find((c: any) => c.name === "Miscellaneous" && c.kind === "expense");

    if (difference > 0) {
      if (!incomeCat) {
        toast.error("Income category 'Other Income' not found");
        return;
      }
      const tx = {
        id: uid(),
        type: "income" as const,
        amount: difference,
        walletId: wallet.id,
        categoryId: incomeCat.id,
        date: now,
        notes: note || "Balance adjustment",
        createdAt: now,
        updatedAt: now,
      };
      setTransactions((arr) => [...arr, tx]);
      toast.success(`Balance adjusted: +${formatIDR(difference)}`);
    } else {
      if (!expenseCat) {
        toast.error("Expense category 'Miscellaneous' not found");
        return;
      }
      const tx = {
        id: uid(),
        type: "expense" as const,
        amount: Math.abs(difference),
        walletId: wallet.id,
        categoryId: expenseCat.id,
        date: now,
        notes: note || "Balance adjustment",
        createdAt: now,
        updatedAt: now,
      };
      setTransactions((arr) => [...arr, tx]);
      toast.success(`Balance adjusted: ${formatIDR(difference)}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adjust Balance</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium">{wallet.name}</p>
            <p className="text-xs text-muted-foreground">{wallet.type} · {wallet.currency}</p>
          </div>
          <div className="grid gap-1.5">
            <Label>Current Balance</Label>
            <p className="num text-lg font-semibold">{isIDR ? formatIDR(currentBalance) : formatNumberID(currentBalance, 8) + " " + wallet.currency}</p>
          </div>
          <div className="grid gap-1.5">
            <Label>New Balance</Label>
            <NumberInputID value={newBalance} onChange={setNewBalance} decimals={!isIDR} placeholder={isIDR ? "0" : "0,00"} />
          </div>
          <div className="grid gap-1.5">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for adjustment" />
          </div>
          {difference !== 0 && (
            <div className={"text-sm p-3 rounded-lg " + (difference > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {difference > 0 ? "Will add" : "Will subtract"} {isIDR ? formatIDR(Math.abs(difference)) : formatNumberID(Math.abs(difference), 8) + " " + wallet.currency} ({difference > 0 ? "Income" : "Expense"})
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={difference === 0}>Save Adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
