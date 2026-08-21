import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLocation } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityGraph } from "@/components/graph/EntityGraph";
import { LocationDialog } from "@/components/forms/LocationDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { formatRating } from "@/lib/format";

export function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locationId = id ?? "";
  const { data, isLoading, error } = useLocation(locationId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = mutations.location.delete();

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Location not found." />;

  return (
    <>
      <PageHeader
        title={detail.city}
        description={`${detail.country} · ${detail.region}`}
        accent={entityAccent("Location")}
      >
        <Badge variant="secondary">{detail.region}</Badge>
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
              <StationDot color={entityAccent("Location")} />
              Local graph
            </CardTitle>
            <CardDescription>Suppliers and departments here — click any node to navigate.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntityGraph nodeId={detail.id} depth={2} height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>{detail.departments.length} department(s) based here</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.departments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No departments based here.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.departments.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <StationDot color={entityAccent("Department")} />
                    <Link className="text-primary hover:underline" to={`/departments/${d.id}`}>
                      {d.name}
                    </Link>
                    <span className="text-muted-foreground"> — {d.costCenter}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>{detail.suppliers.length} supplier(s) based here</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suppliers based here.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.suppliers.map((s) => (
                  <li key={s.id} className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <StationDot color={entityAccent("Supplier")} />
                      <Link className="text-primary hover:underline" to={`/suppliers/${s.id}`}>
                        {s.name}
                      </Link>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Rating {formatRating(s.rating)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <LocationDialog
        open={editing}
        onOpenChange={setEditing}
        {...(detail ? { initial: detail } : {})}
      />
      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${detail.city}?`}
        description="This removes the location and any supplier/department LOCATED_IN edges. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={() => {
          del.mutateAsync(detail.id).then(() => navigate("/locations"));
        }}
      />
    </>
  );
}
