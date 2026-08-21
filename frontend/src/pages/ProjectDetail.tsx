import { Link, useParams } from "react-router-dom";
import { useProject } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projectStatusVariant, PROJECT_STATUS_LABEL } from "@/lib/format";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const { data, isLoading, error } = useProject(projectId);

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Project not found." />;

  return (
    <>
      <PageHeader title={detail.name}>
        <Badge variant={projectStatusVariant(detail.status)}>
          {PROJECT_STATUS_LABEL[detail.status]}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <li key={m.id}>
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
                  <li key={p.id}>
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
    </>
  );
}
