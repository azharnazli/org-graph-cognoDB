import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  line: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", line: "hsl(var(--line-command))", end: true },
  { to: "/people", label: "People", line: "hsl(var(--line-command))" },
  { to: "/departments", label: "Departments", line: "hsl(var(--line-works))" },
  { to: "/projects", label: "Projects", line: "hsl(var(--line-projects))" },
  { to: "/products", label: "Products", line: "hsl(var(--line-role))" },
  { to: "/suppliers", label: "Suppliers", line: "hsl(var(--line-supply))" },
  { to: "/locations", label: "Locations", line: "hsl(var(--line-slate))" },
  { to: "/explorer", label: "Explorer", line: "hsl(var(--line-slate))" },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 z-20 flex h-screen w-14 shrink-0 flex-col border-r border-border bg-background sm:w-56">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <Roundel />
        <span className="hidden font-mono text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground sm:block">
          org·graph
        </span>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col gap-0.5 px-2 sm:px-3">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                {...(item.end !== undefined ? { end: item.end } : {})}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-2 rounded-sm px-2 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors sm:px-3",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={cn("h-2 w-2 shrink-0 rounded-full", isActive ? "" : "opacity-40")}
                      style={{ backgroundColor: item.line }}
                    />
                    <span className="hidden sm:inline">{item.label}</span>
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1 left-0 w-[2px] rounded-full"
                        style={{ backgroundColor: item.line }}
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function Roundel() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden className="shrink-0">
      <circle cx="11" cy="11" r="10" fill="hsl(var(--line-command))" />
      <rect x="3" y="9.5" width="16" height="3" rx="1.5" fill="hsl(var(--background))" />
    </svg>
  );
}
