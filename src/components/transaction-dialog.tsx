import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance } from "@/lib/finance/store";
import type { Transaction, TxType } from "@/lib/finance/types";
import { uid } from "@/lib/finance/seed";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
  editing?: Transaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionDialog({ trigger, editing, open: ctrlOpen, onOpenChange }: Props) {
  const { state, setTransactions } = useFinance();
  const [open, setOpen] = useState(false);
  const isControlled = ctrlOpen !== undefined;
  const isOpen = isControlled ? ctrlOpen : open;
  const setIsOpen = (v: boolean) => { if (isControlled) onOpenChange?.(v); else setOpen(v); };

  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [fromWalletId, setFromWalletId] = useState<string>("");
  const [toWalletId, setToWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [holdingId, setHoldingId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [pricePerUnit, setPricePerUnit] = useState<string>("");
  const [fee, setFee] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setType(editing.type);
      setDate(editing.date.slice(0, 10));
      setNotes(editing.notes ?? "");
      if (editing.type === "income" || editing.type === "expense") {
        setAmount(String(editing.amount));
        setWalletId(editing.walletId);
        setCategoryId(editing.categoryId);
      } else if (editing.type === "transfer") {
        setAmount(String(editing.amount));
        setFromWalletId(editing.fromWalletId);
        setToWalletId(editing.toWalletId);
      } else if (editing.type === "buy") {
        setAmount(String(editing.amountPaid));
        setFromWalletId(editing.fromWalletId);
        setHoldingId(editing.holdingId);
        setQuantity(String(editing.quantity));
        setPricePerUnit(String(editing.pricePerUnit));
        setFee(editing.fee ? String(editing.fee) : "");
      } else if (editing.type === "sell") {
        setQuantity(String(editing.quantity));
        setHoldingId(editing.holdingId);
        setToWalletId(editing.toWalletId);
        setPricePerUnit(String(editing.pricePerUnit));
        setFee(editing.fee ? String(editing.fee) : "");
      }
    }
  }, [isOpen, editing]);

  const wallets = state.wallets.filter((w) => !w.archived);
  const cashWallets = wallets.filter((w) => ["Bank", "Cash", "E-wallet"].includes(w.type));
  const cats = state.categories.filter((c) => !c.archived);
  const expCats = cats.filter((c) => c.kind === "expense");
  const incCats = cats.filter((c) => c.kind === "income");

  const submit = () => {
    const base = { id: editing?.id ?? uid(), date: new Date(date).toISOString(), notes: notes || undefined, createdAt: editing?.createdAt ?? new Date().toISOString() };
    let tx: Transaction | null = null;
    const n = (v: string) => Number(v) || 0;
    if (type === "income") {
      if (!walletId || !categoryId || !amount) return toast.error("Fill all required fields");
      tx = { ...base, type, amount: n(amount), walletId, categoryId };
    } else if (type === "expense") {
      if (!walletId || !categoryId || !amount) return toast.error("Fill all required fields");
      tx = { ...base, type, amount: n(amount), walletId, categoryId };
    } else if (type === "transfer") {
      if (!fromWalletId || !toWalletId || !amount) return toast.error("Fill all required fields");
      if (fromWalletId === toWalletId) return toast.error("Source and destination must differ");
      tx = { ...base, type, amount: n(amount), fromWalletId, toWalletId };
    } else if (type === "buy") {
      if (!fromWalletId || !holdingId || !quantity || !pricePerUnit) return toast.error("Fill all required fields");
      const amt = amount ? n(amount) : n(quantity) * n(pricePerUnit);
      tx = { ...base, type, amountPaid: amt, fromWalletId, holdingId, quantity: n(quantity), pricePerUnit: n(pricePerUnit), fee: fee ? n(fee) : undefined };
    } else if (type === "sell") {
      if (!toWalletId || !holdingId || !quantity || !pricePerUnit) return toast.error("Fill all required fields");
      tx = { ...base, type, quantity: n(quantity), holdingId, toWalletId, pricePerUnit: n(pricePerUnit), fee: fee ? n(fee) : undefined };
    }
    if (!tx) return;
    setTransactions((arr) => editing ? arr.map((t) => t.id === tx!.id ? tx! : t) : [tx!, ...arr]);
    toast.success(editing ? "Transaction updated" : "Transaction added");
    setIsOpen(false);
    if (!editing) {
      setAmount(""); setNotes(""); setQuantity(""); setPricePerUnit(""); setFee("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as TxType)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-3 mt-2">
          {(type === "income" || type === "expense") && (
            <>
              <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <Field label={type === "income" ? "Destination Wallet" : "Source Wallet"}>
                <WalletSelect wallets={wallets} value={walletId} onChange={setWalletId} />
              </Field>
              <Field label="Category">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(type === "income" ? incCats : expCats).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          {type === "transfer" && (
            <>
              <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <Field label="From"><WalletSelect wallets={wallets} value={fromWalletId} onChange={setFromWalletId} /></Field>
              <Field label="To"><WalletSelect wallets={wallets} value={toWalletId} onChange={setToWalletId} /></Field>
            </>
          )}
          {type === "buy" && (
            <>
              <Field label="From Cash Wallet"><WalletSelect wallets={cashWallets} value={fromWalletId} onChange={setFromWalletId} /></Field>
              <Field label="Asset">
                <Select value={holdingId} onValueChange={setHoldingId}>
                  <SelectTrigger><SelectValue placeholder="Select holding" /></SelectTrigger>
                  <SelectContent>
                    {state.holdings.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} ({h.symbol})</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity"><Input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
                <Field label="Price/unit"><Input type="number" step="any" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount Paid (optional)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="auto" /></Field>
                <Field label="Fee (optional)"><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
              </div>
            </>
          )}
          {type === "sell" && (
            <>
              <Field label="Asset">
                <Select value={holdingId} onValueChange={setHoldingId}>
                  <SelectTrigger><SelectValue placeholder="Select holding" /></SelectTrigger>
                  <SelectContent>
                    {state.holdings.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} ({h.symbol})</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="To Cash Wallet"><WalletSelect wallets={cashWallets} value={toWalletId} onChange={setToWalletId} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity"><Input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
                <Field label="Sell Price/unit"><Input type="number" step="any" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} /></Field>
              </div>
              <Field label="Fee (optional)"><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
            </>
          )}
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={submit}>{editing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function WalletSelect({ wallets, value, onChange }: { wallets: { id: string; name: string; icon: string; currency: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select wallet" /></SelectTrigger>
      <SelectContent>
        {wallets.map((w) => (
          <SelectItem key={w.id} value={w.id}>{w.icon} {w.name} <span className="text-xs text-muted-foreground ml-1">({w.currency})</span></SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
