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
import { NumberInputID } from "@/components/number-input";
import { nowDateTimeLocalInput, toDateTimeLocalInput, fromDateTimeLocalInput } from "@/lib/finance/format";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
  editing?: Transaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionDialog({ trigger, editing, open: ctrlOpen, onOpenChange }: Props) {
  const { state, createTransaction, updateTransaction } = useFinance();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isControlled = ctrlOpen !== undefined;
  const isOpen = isControlled ? ctrlOpen : open;
  const setIsOpen = (v: boolean) => { if (isControlled) onOpenChange?.(v); else setOpen(v); };

  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState<number>(0);
  const [walletId, setWalletId] = useState<string>("");
  const [fromWalletId, setFromWalletId] = useState<string>("");
  const [toWalletId, setToWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [holdingId, setHoldingId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [dateTime, setDateTime] = useState<string>(nowDateTimeLocalInput());
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setType(editing.type);
      setDateTime(toDateTimeLocalInput(editing.date));
      setNotes(editing.notes ?? "");
      if (editing.type === "income" || editing.type === "expense") {
        setAmount(editing.amount);
        setWalletId(editing.walletId);
        setCategoryId(editing.categoryId);
      } else if (editing.type === "transfer") {
        setAmount(editing.amount);
        setFromWalletId(editing.fromWalletId);
        setToWalletId(editing.toWalletId);
      } else if (editing.type === "buy") {
        setAmount(editing.amountPaid);
        setFromWalletId(editing.fromWalletId);
        setHoldingId(editing.holdingId);
        setQuantity(editing.quantity);
        setPricePerUnit(editing.pricePerUnit);
        setFee(editing.fee ?? 0);
      } else if (editing.type === "sell") {
        setQuantity(editing.quantity);
        setHoldingId(editing.holdingId);
        setToWalletId(editing.toWalletId);
        setPricePerUnit(editing.pricePerUnit);
        setFee(editing.fee ?? 0);
      }
    } else {
      // Reset for a new entry — default to current local datetime including seconds.
      setType("expense");
      setDateTime(nowDateTimeLocalInput());
      setAmount(0); setQuantity(0); setPricePerUnit(0); setFee(0);
      setWalletId(""); setFromWalletId(""); setToWalletId(""); setCategoryId(""); setHoldingId("");
      setNotes("");
    }
  }, [isOpen, editing]);

  const wallets = state.wallets.filter((w) => !w.archived);
  const cashWallets = wallets.filter((w) => ["Bank", "Cash", "E-wallet"].includes(w.type));
  const cats = state.categories.filter((c) => !c.archived);
  const expCats = cats.filter((c) => c.kind === "expense");
  const incCats = cats.filter((c) => c.kind === "income");

  const submit = async () => {
    const nowIso = new Date().toISOString();
    const base = {
      id: editing?.id ?? uid(),
      date: fromDateTimeLocalInput(dateTime),
      notes: notes || undefined,
      createdAt: editing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };
    let tx: Transaction | null = null;
    if (type === "income") {
      if (!walletId || !categoryId || !amount) return toast.error("Fill all required fields");
      tx = { ...base, type, amount, walletId, categoryId };
    } else if (type === "expense") {
      if (!walletId || !categoryId || !amount) return toast.error("Fill all required fields");
      tx = { ...base, type, amount, walletId, categoryId };
    } else if (type === "transfer") {
      if (!fromWalletId || !toWalletId || !amount) return toast.error("Fill all required fields");
      if (fromWalletId === toWalletId) return toast.error("Source and destination must differ");
      tx = { ...base, type, amount, fromWalletId, toWalletId };
    } else if (type === "buy") {
      if (!fromWalletId || !holdingId || !quantity || !pricePerUnit) return toast.error("Fill all required fields");
      const amt = amount || quantity * pricePerUnit;
      tx = { ...base, type, amountPaid: amt, fromWalletId, holdingId, quantity, pricePerUnit, fee: fee || undefined };
    } else if (type === "sell") {
      if (!toWalletId || !holdingId || !quantity || !pricePerUnit) return toast.error("Fill all required fields");
      tx = { ...base, type, quantity, holdingId, toWalletId, pricePerUnit, fee: fee || undefined };
    }
    if (!tx) return;

    setIsSaving(true);
    try {
      if (editing) {
        await updateTransaction(tx);
        toast.success("Transaction updated");
      } else {
        await createTransaction(tx);
        toast.success("Transaction added");
      }
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save transaction");
    } finally {
      setIsSaving(false);
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
              <Field label="Amount (Rp)"><NumberInputID value={amount} onChange={setAmount} placeholder="0" /></Field>
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
              <Field label="Amount"><NumberInputID value={amount} onChange={setAmount} decimals placeholder="0" /></Field>
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
                <Field label="Quantity"><NumberInputID value={quantity} onChange={setQuantity} decimals /></Field>
                <Field label="Price/unit (Rp)"><NumberInputID value={pricePerUnit} onChange={setPricePerUnit} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount Paid (opt.)"><NumberInputID value={amount} onChange={setAmount} placeholder="auto" /></Field>
                <Field label="Fee (opt.)"><NumberInputID value={fee} onChange={setFee} /></Field>
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
                <Field label="Quantity"><NumberInputID value={quantity} onChange={setQuantity} decimals /></Field>
                <Field label="Sell Price/unit (Rp)"><NumberInputID value={pricePerUnit} onChange={setPricePerUnit} /></Field>
              </div>
              <Field label="Fee (opt.)"><NumberInputID value={fee} onChange={setFee} /></Field>
            </>
          )}
          <Field label="Date & Time">
            <Input type="datetime-local" step={1} value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </Field>
          <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={submit} disabled={isSaving}>{isSaving ? "Saving..." : (editing ? "Save" : "Add")}</Button>
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
