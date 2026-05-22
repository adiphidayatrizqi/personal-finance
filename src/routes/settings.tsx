import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Archive, ArchiveRestore, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/lib/finance/store";
import { uid } from "@/lib/finance/seed";
import type { Category, CategoryKind } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Worthly" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Manage categories and app data</p>
      </div>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-6"><Categories /></TabsContent>
        <TabsContent value="data" className="mt-6"><DataPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function Categories() {
  const { state, setCategories } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const groups: CategoryKind[] = ["expense", "income", "investment"];
  const titleOf = (k: CategoryKind) => k.charAt(0).toUpperCase() + k.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="rounded-xl" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>
      {groups.map((k) => (
        <div key={k} className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/40">
            <h3 className="text-sm font-semibold">{titleOf(k)} Categories</h3>
          </div>
          <ul>
            {state.categories.filter((c) => c.kind === k).map((c) => (
              <li key={c.id} className={"flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 " + (c.archived ? "opacity-50" : "")}>
                <span className="text-lg">{c.icon}</span>
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                {c.archived && <span className="text-xs text-muted-foreground">Archived</span>}
                <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => {
                  setCategories((arr) => arr.map((x) => x.id === c.id ? { ...x, archived: !x.archived } : x));
                }}>{c.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
                <Button size="icon" variant="ghost" onClick={() => {
                  if (!confirm("Delete category?")) return;
                  setCategories((arr) => arr.filter((x) => x.id !== c.id));
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
            {state.categories.filter((c) => c.kind === k).length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-muted-foreground">No categories</li>
            )}
          </ul>
        </div>
      ))}

      <CategoryDialog open={open} onOpenChange={setOpen} editing={editing} onSave={(c) => {
        setCategories((arr) => editing ? arr.map((x) => x.id === c.id ? c : x) : [...arr, c]);
        toast.success("Saved");
        setOpen(false);
      }} />
    </div>
  );
}

function CategoryDialog({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Category | null; onSave: (c: Category) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [icon, setIcon] = useState("💸");

  useEffect(() => {
    if (!open) return;
    if (editing) { setName(editing.name); setKind(editing.kind); setIcon(editing.icon); }
    else { setName(""); setKind("expense"); setIcon("💸"); }
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CategoryKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Icon (emoji)</Label><Input value={icon} onChange={(e) => setIcon(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!name) return toast.error("Name required");
            onSave({ id: editing?.id ?? uid(), name, kind, icon, archived: editing?.archived ?? false });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DataPanel() {
  const { reset } = useFinance();
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft max-w-xl">
      <h3 className="text-sm font-semibold mb-2">Reset demo data</h3>
      <p className="text-sm text-muted-foreground mb-4">All your wallets, transactions, holdings, prices, budgets and goals will be replaced with the default sample data.</p>
      <Button variant="outline" onClick={() => {
        if (!confirm("Reset all data? This cannot be undone.")) return;
        reset();
        toast.success("Data reset");
      }}>
        <RotateCcw className="h-4 w-4" /> Reset to sample data
      </Button>
    </div>
  );
}
