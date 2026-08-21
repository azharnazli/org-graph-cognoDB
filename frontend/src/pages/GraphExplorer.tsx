import { useState } from "react";
import { Play } from "lucide-react";
import { useRunCypher, type CypherResult } from "@/hooks/useCypher";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const PRESETS: { label: string; cypher: string }[] = [
  {
    label: "All labels",
    cypher: "MATCH (n) RETURN labels(n) AS label, count(n) AS total ORDER BY label",
  },
  {
    label: "Top 10 suppliers by rating",
    cypher: "MATCH (s:Supplier) RETURN s.name AS name, s.rating AS rating ORDER BY s.rating DESC LIMIT 10",
  },
  {
    label: "Active projects + managers",
    cypher:
      "MATCH (p:Person)-[:MANAGES]->(proj:Project {status: 'active'}) RETURN proj.name AS project, collect(p.name) AS managers ORDER BY project",
  },
  {
    label: "Departments + headcount",
    cypher:
      "MATCH (p:Person)-[:WORKS_IN]->(d:Department) RETURN d.name AS department, count(p) AS headcount ORDER BY headcount DESC",
  },
  {
    label: "Product → suppliers → location",
    cypher:
      "MATCH (p:Product)-[:SUPPLIED_BY]->(s:Supplier)-[:LOCATED_IN]->(l:Location) RETURN p.name AS product, s.name AS supplier, l.region AS region LIMIT 25",
  },
];

export function GraphExplorerPage() {
  const [cypher, setCypher] = useState<string>(PRESETS[0]?.cypher ?? "");
  const [result, setResult] = useState<CypherResult | null>(null);
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const run = useRunCypher();

  const execute = async (q: string): Promise<void> => {
    setErrMessage(null);
    setResult(null);
    try {
      const res = await run.mutateAsync({ cypher: q });
      setResult(res);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setErrMessage(message);
    }
  };

  return (
    <>
      <PageHeader
        title="Graph Explorer"
        description="Run a read-only Cypher query against the graph."
      />

      <Card>
        <CardHeader>
          <CardTitle>Cypher</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={cypher}
            onChange={(e) => setCypher(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void execute(cypher)} disabled={run.isPending || !cypher.trim()}>
              <Play className="h-4 w-4" />
              {run.isPending ? "Running..." : "Run"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Read-only — write keywords (CREATE/MERGE/DELETE/SET/etc.) are blocked server-side.
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Presets:</span>
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCypher(p.cypher)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {errMessage ? (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Query failed</AlertTitle>
          <AlertDescription>{errMessage}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Results ({result.count})</CardTitle>
          </CardHeader>
          <CardContent>
            {result.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Query returned no rows.</p>
            ) : (
              <ResultsTable rows={result.data} />
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function ResultsTable({ rows }: { rows: Record<string, unknown>[] }) {
  const first = rows[0];
  if (!first) return null;
  const columns = Object.keys(first);

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {columns.map((c) => (
              <th key={c} className="px-2 py-2 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((c) => (
                <td key={c} className="px-2 py-2 align-top font-mono text-xs">
                  {formatCell(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
