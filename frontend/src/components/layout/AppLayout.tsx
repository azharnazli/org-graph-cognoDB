import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/useHealth";

export function AppLayout() {
  const health = useHealth();

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground antialiased">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-end border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6">
          <ServiceStatus status={health.data?.database} />
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          org-graph · an org &amp; supply chain, read as a network
        </p>
        <RouteLegend />
      </div>
    </footer>
  );
}

function RouteLegend() {
  const lines = [
    { name: "Command", color: "hsl(var(--primary))" },
    { name: "Works", color: "hsl(var(--secondary))" },
    { name: "Projects", color: "hsl(var(--line-projects))" },
    { name: "Supply", color: "hsl(var(--destructive))" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {lines.map((l) => (
        <span
          key={l.name}
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span
            className="h-[3px] w-5 rounded-full"
            style={{ backgroundColor: l.color }}
            aria-hidden
          />
          {l.name}
        </span>
      ))}
    </div>
  );
}

function ServiceStatus({
  status,
}: {
  status: "connected" | "unreachable" | undefined;
}) {
  const label =
    status === "connected"
      ? "Good service"
      : status === "unreachable"
        ? "Severe delays"
        : "Status check";
  const dot =
    status === "connected"
      ? "bg-line-works"
      : status === "unreachable"
        ? "bg-line-supply"
        : "bg-line-projects animate-pulse";

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
      title={
        status === "connected"
          ? "Graph database connected"
          : status === "unreachable"
            ? "Graph database unreachable"
            : "Checking graph database…"
      }
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
