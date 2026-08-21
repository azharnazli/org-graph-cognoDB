import { lazy, Suspense, useState } from "react";
import { useGraph, type GraphView } from "@/hooks/useGraph";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LABEL_LEGEND } from "@/lib/graph-colors";

const GraphCanvas = lazy(() =>
  import("@/components/graph/GraphCanvas").then((m) => ({ default: m.GraphCanvas })),
);

const VIEWS: Array<{ id: GraphView; label: string; description: string }> = [
  { id: "org", label: "Org Chart", description: "People, departments, roles — reporting structure" },
  { id: "supply", label: "Supply Chain", description: "Projects, products, suppliers, locations" },
  { id: "all", label: "Full Graph", description: "Every node and relationship" },
];

export function GraphExplorerPage() {
  const [view, setView] = useState<GraphView>("org");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, error } = useGraph(view);

  const graph = data?.data;
  const selected = graph?.nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Graph Explorer"
        description="Explore the graph by view. Click any node to navigate to its detail page."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            variant={view === v.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setView(v.id); setSelectedId(null); }}
          >
            {v.label}
          </Button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {VIEWS.find((v) => v.id === view)?.description}
        </span>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load graph</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          {isLoading ? (
            <Skeleton className="h-[640px] w-full" />
          ) : graph ? (
            <Suspense fallback={<Skeleton className="h-[640px] w-full" />}>
              <GraphCanvas
                nodes={graph.nodes}
                links={graph.links}
                selectedId={selectedId}
                height={640}
              />
            </Suspense>
          ) : null}

          <Legend />
        </div>

        <div>
          <SelectedNodePanel node={selected} />
        </div>
      </div>
    </>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
      <span className="text-muted-foreground">Legend:</span>
      {LABEL_LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: l.color }}
          />
          <span>{l.label}</span>
        </span>
      ))}
    </div>
  );
}

function SelectedNodePanel({ node }: { node: ReturnType<typeof useGraph>["data"] extends infer D ? D extends { data: { nodes: Array<infer N> } } ? N | null : never : never }) {
  if (!node) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Node details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click a node to see its properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {node.name}
          <Badge variant="secondary">{node.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Properties</h4>
          <dl className="space-y-1 text-sm">
            {Object.entries(node.properties).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                <dd className="break-all">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
