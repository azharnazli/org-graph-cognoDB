import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSupplier } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityGraph } from "@/components/graph/EntityGraph";
import { SupplierDialog } from "@/components/forms/SupplierDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { formatRating } from "@/lib/format";

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const supplierId = id ?? "";
  const { data, isLoading, error } = useSupplier(supplierId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = mutations.supplier.delete();

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Supplier not found." />;

  return (
    <>
      <PageHeader title={detail.name} accent={entityAccent("Supplier")}>
        <Badge variant="outline">Rating {formatRating(detail.rating)}</Badge>
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
              <StationDot color={entityAccent("Supplier")} />
              Local graph
            </CardTitle>
            <CardDescription>Products, location — click any node to navigate.</CardDescription>
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
            <CardTitle>Products supplied</CardTitle>
            <CardDescription>{detail.products.length} product(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products supplied.</p>
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

      <SupplierDialog
        open={editing}
        onOpenChange={setEditing}
        {...(detail ? { initial: detail } : {})}
      />
      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${detail.name}?`}
        description="This removes the supplier and any product-supply edges. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={() => {
          del.mutateAsync(detail.id).then(() => navigate("/suppliers"));
        }}
      />
    </>
  );
}
