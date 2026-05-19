import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/lib/finance/store";
import { uid } from "@/lib/finance/seed";
import { fmtIDR, monthlySpendByCategory } from "@/lib/finance/compute";
import type { Budget, Goal } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Plan — Savvr" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Plan</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Budgets and goals to keep you on track</p>
      </div>
      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets" className="mt-6"><Budgets /></TabsContent>
        <TabsContent value="goals" className="mt-6"><Goals /></TabsContent>
      </Tabs>
    </div>
  );
}

function Budgets() {
  const { state, setBudgets, hydrated } = useFinance();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editing, setEditing] = useState<Budget | null>(null);
  const [open, setOpen] = useState(false);

  const used = monthlySpendByCategory(state, month);
  const monthBudgets = state.budgets.filter((b) => b.month === month);
  const catById = (id: string) => state.categories.find((c) => c.id === id);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Label>Month</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
        </div>
        <Button className="rounded-xl" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Budget</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monthBudgets.length === 0 && hydrated && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No budgets for this month yet.</p>
          </div>
        )}
        {monthBudgets.map((b) => {
          const u = used[b.categoryId] ?? 0;
          const pct = b.amount > 0 ? Math.min((u / b.amount) * 100, 100) : 0;
          const over = u > b.amount;
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold">{catById(b.categoryId)?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{month}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    setBudgets((arr) => arr.filter((x) => x.id !== b.id));
                    toast.success("Deleted");
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="num text-2xl font-semibold">{fmtIDR(u)}</span>
                <span className="num text-xs text-muted-foreground">of {fmtIDR(b.amount)}</span>
              </div>
              <Progress value={pct} className={over ? "[&>div]:bg-warning" : ""} />
              <div className="flex justify-between mt-2">
                <span className={"num text-xs " + (over ? "text-warning flex items-center gap-1" : "text-muted-foreground")}>
                  {over && <AlertTriangle className="h-3 w-3" />}
                  {over ? `Over by ${fmtIDR(u - b.amount)}` : `Remaining ${fmtIDR(b.amount - u)}`}
                </span>
                <span className="num text-xs text-muted-foreground">{((u / b.amount) * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <BudgetDialog open={open} onOpenChange={setOpen} editing={editing} month={month} onSave={(b) => {
        setBudgets((arr) => editing ? arr.map((x) => x.id === b.id ? b : x) : [...arr, b]);
        toast.success("Saved");
        setOpen(false);
      }} />
    </div>
  );
}

function BudgetDialog({ open, onOpenChange, editing, month, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Budget | null; month: string; onSave: (b: Budget) => void }) {
  const { state } = useFinance();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("0");
  const [m, setM] = useState(month);

  useEffect(() => {
    if (!open) return;
    if (editing) { setCategoryId(editing.categoryId); setAmount(String(editing.amount)); setM(editing.month); }
    else { setCategoryId(""); setAmount("0"); setM(month); }
  }, [open, editing, month]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Budget" : "Add Budget"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Month</Label><Input type="month" value={m} onChange={(e) => setM(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{state.categories.filter(c => c.kind === "expense" && !c.archived).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5"><Label>Budget Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!categoryId) return toast.error("Category required");
            onSave({ id: editing?.id ?? uid(), categoryId, amount: Number(amount) || 0, month: m });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Goals() {
  const { state, setGoals, hydrated } = useFinance();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button className="rounded-xl" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Goal</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.goals.length === 0 && hydrated && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No goals yet.</p>
          </div>
        )}
        {state.goals.map((g) => {
          const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold">{g.name}</p>
                    {g.deadline && <p className="text-xs text-muted-foreground">by {new Date(g.deadline).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(g); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    setGoals((arr) => arr.filter((x) => x.id !== g.id));
                    toast.success("Deleted");
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="num text-xl font-semibold">{g.current.toLocaleString("id-ID")}</span>
                <span className="num text-xs text-muted-foreground">of {g.target.toLocaleString("id-ID")}</span>
              </div>
              <Progress value={pct} />
              <p className="num text-xs text-muted-foreground mt-2">{pct.toFixed(0)}% complete</p>
            </div>
          );
        })}
      </div>

      <GoalDialog open={open} onOpenChange={setOpen} editing={editing} onSave={(g) => {
        setGoals((arr) => editing ? arr.map((x) => x.id === g.id ? g : x) : [...arr, g]);
        toast.success("Saved");
        setOpen(false);
      }} />
    </div>
  );
}

function GoalDialog({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Goal | null; onSave: (g: Goal) => void }) {
  const { state } = useFinance();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("0");
  const [current, setCurrent] = useState("0");
  const [walletId, setWalletId] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name); setTarget(String(editing.target)); setCurrent(String(editing.current));
      setWalletId(editing.walletId ?? ""); setDeadline(editing.deadline?.slice(0, 10) ?? "");
    } else { setName(""); setTarget("0"); setCurrent("0"); setWalletId(""); setDeadline(""); }
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Goal" : "Add Goal"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Target</Label><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Current</Label><Input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Linked Wallet (optional)</Label>
            <Select value={walletId || "none"} onValueChange={(v) => setWalletId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {state.wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5"><Label>Deadline (optional)</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!name) return toast.error("Name required");
            onSave({
              id: editing?.id ?? uid(), name, target: Number(target) || 0, current: Number(current) || 0,
              walletId: walletId || undefined, deadline: deadline ? new Date(deadline).toISOString() : undefined,
            });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
