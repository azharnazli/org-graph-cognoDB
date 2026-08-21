import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/people", label: "People" },
  { to: "/departments", label: "Departments" },
  { to: "/projects", label: "Projects" },
  { to: "/products", label: "Products" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/locations", label: "Locations" },
  { to: "/explorer", label: "Graph Explorer" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        <div className="font-semibold">org-graph</div>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              {...(item.end !== undefined ? { end: item.end } : {})}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
