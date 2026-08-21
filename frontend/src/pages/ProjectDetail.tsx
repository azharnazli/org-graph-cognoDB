import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProject } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityGraph } from "@/components/graph/EntityGraph";
import { ProjectDialog } from "@/components/forms/ProjectDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { projectStatusVariant, PROJECT_STATUS_LABEL } from "@/lib/format";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ?? "";
  const { data, isLoading, error } = useProject(projectId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = mutations.project.delete();

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Project not found." />;

  return (
    <>
      <PageHeader title={detail.name} accent={entityAccent("Project")}>
        <Badge variant={projectStatusVariant(detail.status)}>
          {PROJECT_STATUS_LABEL[detail.status]}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StationDot color={entityAccent("Project")} />
              Local graph
            </CardTitle>
            <CardDescription>Managers, department, products — click any node to navigate.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntityGraph nodeId={detail.id} depth={2} height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owning department</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.department ? (
              <Link className="text-primary hover:underline" to={`/departments/${detail.department.id}`}>
                {detail.department.name}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">No department.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managers</CardTitle>
            <CardDescription>{detail.managers.length} people manage this project</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.managers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No managers.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.managers.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <StationDot color={entityAccent("Person")} />
                    <Link className="text-primary hover:underline" to={`/people/${m.id}`}>
                      {m.name}
                    </Link>
                    <span className="text-muted-foreground"> — {m.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Products used by this project</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <StationDot color={entityAccent("Product")} />
                    <Link className="text-primary hover:underline" to={`/products/${p.id}`}>
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground"> — {p.sku}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectDialog
        open={editing}
        onOpenChange={setEditing}
        {...(detail ? { initial: detail } : {})}
      />
      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${detail.name}?`}
        description="This removes the project and its USES/MANAGES relationships. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={() => {
          del.mutateAsync(detail.id).then(() => navigate("/projects"));
        }}
      />
    </>
  );
}
