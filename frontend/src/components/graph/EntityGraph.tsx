import { lazy, Suspense } from "react";
import { useGraph } from "@/hooks/useGraph";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const GraphCanvas = lazy(() =>
  import("@/components/graph/GraphCanvas").then((m) => ({ default: m.GraphCanvas })),
);

export interface EntityGraphProps {
  nodeId: string;
  depth?: number;
  height?: number;
  title?: string;
}

export function EntityGraph({ nodeId, depth = 2, height = 360, title }: EntityGraphProps) {
  const { data, isLoading, error } = useGraph("neighborhood", { node: nodeId, depth });

  return (
    <div className="space-y-2">
      {title ? <h3 className="text-sm font-medium">{title}</h3> : null}
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load graph</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      ) : isLoading || !data ? (
        <Skeleton className="w-full" style={{ height }} />
      ) : data.data.nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No connections found.</p>
      ) : (
        <Suspense fallback={<Skeleton className="w-full" style={{ height }} />}>
          <GraphCanvas
            nodes={data.data.nodes}
            links={data.data.links}
            selectedId={nodeId}
            height={height}
          />
        </Suspense>
      )}
      <p className="text-xs text-muted-foreground">
        Click any node to navigate to its detail page.
      </p>
    </div>
  );
}
