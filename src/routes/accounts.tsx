import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Savvr" },
      { name: "description", content: "Accounts page on Savvr personal finance dashboard." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="px-6 lg:px-10 py-12 max-w-[1400px] mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground capitalize">accounts</h1>
      <p className="text-sm text-muted-foreground mt-2">Coming soon. This section is part of the prototype navigation.</p>
      <div className="mt-8 rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
        <p className="text-sm text-muted-foreground">Designs for this page will be added in a future iteration.</p>
      </div>
    </div>
  );
}
