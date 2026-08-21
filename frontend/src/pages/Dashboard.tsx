import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Top-level counts across the org graph and supply chain."
      />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data?.data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="People" value={data.data.people} />
            <StatCard title="Departments" value={data.data.departments} />
            <StatCard title="Projects" value={data.data.projects} description={`${data.data.activeProjects} active`} />
            <StatCard title="Products" value={data.data.products} />
            <StatCard title="Suppliers" value={data.data.suppliers} />
            <StatCard title="Locations" value={data.data.locations} />
            <StatCard
              title="Active Projects"
              value={data.data.activeProjects}
              description={`of ${data.data.projects} total`}
            />
            <StatCard
              title="Regions"
              value={Object.keys(data.data.suppliersInRegion).length}
              description="with suppliers"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Suppliers by region</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(data.data.suppliersInRegion).length === 0 ? (
                <p className="text-sm text-muted-foreground">No suppliers located anywhere yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.data.suppliersInRegion)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([region, count]) => (
                      <Badge key={region} variant="secondary" className="text-sm">
                        {region}: {count}
                      </Badge>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
