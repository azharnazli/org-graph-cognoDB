import { Link, useParams } from "react-router-dom";
import { useDepartment } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityGraph } from "@/components/graph/EntityGraph";
import { projectStatusVariant, PROJECT_STATUS_LABEL } from "@/lib/format";

export function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const departmentId = id ?? "";
  const { data, isLoading, error } = useDepartment(departmentId);

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Department not found." />;

  return (
    <>
      <PageHeader title={detail.name} description={`Cost center ${detail.costCenter}`} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Local graph</CardTitle>
            <CardDescription>People, projects, and location — click any node to navigate.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntityGraph nodeId={detail.id} depth={2} height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.location ? (
              <div className="space-y-1 text-sm">
                <div className="font-medium">{detail.location.city}</div>
                <div className="text-muted-foreground">{detail.location.country}</div>
                <Badge variant="secondary">{detail.location.region}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location set.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
            <CardDescription>{detail.people.length} people work here</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.people.length === 0 ? (
              <p className="text-sm text-muted-foreground">No people in this department.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.people.map((p) => (
                  <li key={p.id}>
                    <Link className="text-primary hover:underline" to={`/people/${p.id}`}>
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground"> — {p.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Projects managed by people in this department</CardDescription>
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
                    <Badge variant={projectStatusVariant(p.status)}>
                      {PROJECT_STATUS_LABEL[p.status]}
                    </Badge>
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
