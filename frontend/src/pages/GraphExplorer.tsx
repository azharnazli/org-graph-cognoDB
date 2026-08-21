import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGraph, type GraphNode, type GraphView } from "@/hooks/useGraph";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LABEL_LEGEND, entityAccent } from "@/lib/graph-colors";
import { pathForLabel } from "@/lib/graph-paths";

const GraphCanvas = lazy(() =>
  import("@/components/graph/GraphCanvas").then((m) => ({ default: m.GraphCanvas })),
);

const VIEWS: Array<{ id: GraphView; label: string; color: string; description: string }> = [
  { id: "org", label: "Org Chart", color: entityAccent("Person"), description: "People, departments, roles — reporting structure" },
  { id: "supply", label: "Supply Chain", color: entityAccent("Supplier"), description: "Projects, products, suppliers, locations" },
  { id: "all", label: "Full Graph", color: entityAccent("Role"), description: "Every node and relationship" },
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
        description="Explore the graph by view. Click any node to inspect its properties."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            variant={view === v.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setView(v.id); setSelectedId(null); }}
          >
            <span
              aria-hidden
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: v.color }}
            />
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
                onNodeClick={setSelectedId}
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
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Lines
      </span>
      {LABEL_LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-0.5 w-6 rounded-full"
            style={{ backgroundColor: l.color }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {l.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function SelectedNodePanel({ node }: { node: GraphNode | null }) {
  const navigate = useNavigate();
  const detailPath = node ? pathForLabel(node.label) : undefined;

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
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entityAccent(node.label) }}
          />
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
        {detailPath ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate(`${detailPath}/${node.id}`)}
          >
            Open {node.label} page
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
