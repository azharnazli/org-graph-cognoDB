import { lazy, Suspense } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useGraph } from "@/hooks/useGraph";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { entityAccent } from "@/lib/graph-colors";

const GraphCanvas = lazy(() =>
  import("@/components/graph/GraphCanvas").then((m) => ({ default: m.GraphCanvas })),
);

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const org = useGraph("org");

  const counts = data?.data;
  const graph = org.data?.data;

  return (
    <>
      <PageHeader
        title="Network map"
        description="One graph, seven station types, seven lines — the org chart and its supply chain."
      />

      {/* Route-map plate — the live reporting graph leads the dashboard. */}
      <section aria-labelledby="route-map-heading" className="mb-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2
            id="route-map-heading"
            className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-line-command" />
            Live reporting map
          </h2>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:block">
            command · works · projects
          </span>
        </div>

        {org.error ? (
          <ErrorState
            message={
              org.error instanceof Error ? org.error.message : "Unable to load the map."
            }
          />
        ) : org.isLoading || !graph ? (
          <Skeleton className="h-[440px] w-full" />
        ) : (
          <Suspense fallback={<Skeleton className="h-[440px] w-full" />}>
            <GraphCanvas nodes={graph.nodes} links={graph.links} height={440} />
          </Suspense>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Each station is a person, unit, or place. Click any station to ride to its detail page.
        </p>
      </section>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : counts ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              title="People"
              value={counts.people}
              accent={entityAccent("Person")}
              to="/people"
            />
            <StatCard
              title="Departments"
              value={counts.departments}
              accent={entityAccent("Department")}
              to="/departments"
            />
            <StatCard
              title="Projects"
              value={counts.projects}
              description={`${counts.activeProjects} active`}
              accent={entityAccent("Project")}
              to="/projects"
            />
            <StatCard
              title="Products"
              value={counts.products}
              accent={entityAccent("Product")}
              to="/products"
            />
            <StatCard
              title="Suppliers"
              value={counts.suppliers}
              accent={entityAccent("Supplier")}
              to="/suppliers"
            />
            <StatCard
              title="Locations"
              value={counts.locations}
              accent={entityAccent("Location")}
              to="/locations"
            />
          </div>

          <SupplyDistricts
            districts={Object.entries(counts.suppliersInRegion)}
          />
        </div>
      ) : null}
    </>
  );
}

function SupplyDistricts({ districts }: { districts: Array<[string, number]> }) {
  const sorted = [...districts].sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...sorted.map(([, count]) => count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-line-supply" />
          Supply districts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suppliers located anywhere yet.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map(([region, count]) => (
              <li key={region} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  {region}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-full bg-line-supply"
                    style={{ width: `${Math.round((count / max) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
