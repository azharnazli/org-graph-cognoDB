import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePerson, usePersonReportsChain } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntityGraph } from "@/components/graph/EntityGraph";
import { projectStatusVariant, PROJECT_STATUS_LABEL, ROLE_LEVEL_LABEL, roleLevelVariant, formatDate } from "@/lib/format";

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = usePerson(id);

  const [toId, setToId] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const chain = usePersonReportsChain(id, targetId);

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Person not found." />;

  return (
    <>
      <PageHeader title={detail.name} description={detail.title}>
        <Badge variant="outline">{detail.email}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Local graph</CardTitle>
            <CardDescription>Direct connections in the graph — click any node to navigate.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntityGraph nodeId={detail.id} depth={2} height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="Email" value={detail.email} />
            <Field label="Title" value={detail.title} />
            <Field label="Joined" value={formatDate(detail.joinedAt)} />
            <Field label="Department" value={
              detail.department ? (
                <Link className="text-primary hover:underline" to={`/departments/${detail.department.id}`}>
                  {detail.department.name}
                </Link>
              ) : <span className="text-muted-foreground">—</span>
            } />
            <Field label="Role" value={
              detail.role ? (
                <Badge variant={roleLevelVariant(detail.role.level)}>
                  {ROLE_LEVEL_LABEL[detail.role.level]}
                </Badge>
              ) : <span className="text-muted-foreground">—</span>
            } />
            <Field label="Reports to" value={
              detail.reportsTo ? (
                <Link className="text-primary hover:underline" to={`/people/${detail.reportsTo.id}`}>
                  {detail.reportsTo.name}
                </Link>
              ) : <span className="text-muted-foreground">—</span>
            } />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct reports</CardTitle>
            <CardDescription>{detail.directReports.length} people</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.directReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No direct reports.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.directReports.map((r) => (
                  <li key={r.id}>
                    <Link className="text-primary hover:underline" to={`/people/${r.id}`}>
                      {r.name}
                    </Link>
                    <span className="text-muted-foreground"> — {r.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>{detail.projects.length} managed by this person</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.projects.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <Link className="text-primary hover:underline" to={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                    <Badge variant={projectStatusVariant(p.status)}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Reporting chain (multi-hop)</CardTitle>
            <CardDescription>
              Shortest path up the REPORTS_TO chain from this person to another.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReportsChainPicker
              excludeId={id ?? ""}
              toId={toId}
              onChange={setToId}
              onSubmit={() => setTargetId(toId)}
            />

            {targetId && (
              <ChainResult
                isLoading={chain.isLoading}
                error={chain.error}
                data={chain.data}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ReportsChainPicker({
  excludeId,
  toId,
  onChange,
  onSubmit,
}: {
  excludeId: string;
  toId: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
}) {
  // Use search box for picking target (simpler than a custom dropdown).
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Target person ID (e.g. p_001)"
        value={toId}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-xs"
      />
      <Button size="sm" onClick={onSubmit} disabled={!toId.trim() || toId === excludeId}>
        Find path
      </Button>
      <span className="text-xs text-muted-foreground">
        Tip: try any <code className="rounded bg-muted px-1">p_xxx</code> from the People page.
      </span>
    </div>
  );
}

function ChainResult({
  isLoading,
  error,
  data,
}: {
  isLoading: boolean;
  error: Error | null;
  data: { data: { chain: Array<{ id: string; name: string; title: string }>; hops: number } | null; message?: string } | undefined;
}) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Searching...</p>;
  if (error) return <ErrorState message={error.message} />;
  if (!data?.data) return <p className="text-sm text-muted-foreground">{data?.message ?? "No path."}</p>;

  const chain = data.data.chain;
  const hops = data.data.hops;
  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <div className="mb-2 font-medium">
        Path found in {hops} hop{hops === 1 ? "" : "s"}:
      </div>
      <ol className="flex flex-wrap items-center gap-2">
        {chain.map((node, i) => (
          <li key={node.id} className="flex items-center gap-2">
            <Link className="text-primary hover:underline" to={`/people/${node.id}`}>
              {node.name}
            </Link>
            <span className="text-xs text-muted-foreground">({node.title})</span>
            {i < chain.length - 1 ? <span aria-hidden>→</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
