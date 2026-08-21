import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProduct } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityGraph } from "@/components/graph/EntityGraph";
import { ProductDialog } from "@/components/forms/ProductDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { formatRating } from "@/lib/format";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ?? "";
  const { data, isLoading, error } = useProduct(productId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = mutations.product.delete();

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Product not found." />;

  return (
    <>
      <PageHeader title={detail.name} description={detail.sku} accent={entityAccent("Product")}>
        <Badge variant="secondary">{detail.category}</Badge>
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
              <StationDot color={entityAccent("Product")} />
              Local graph
            </CardTitle>
            <CardDescription>Suppliers, projects, locations — click any node to navigate.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntityGraph nodeId={detail.id} depth={2} height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>{detail.suppliers.length} supplier(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No suppliers.</p>
            ) : (
              <ul className="space-y-2 text-sm">
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
                      {s.location ? ` · ${s.location.city}, ${s.location.country}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects using this product</CardTitle>
            <CardDescription>{detail.projects.length} project(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {detail.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects use this product.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {detail.projects.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <StationDot color={entityAccent("Project")} />
                    <Link className="text-primary hover:underline" to={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductDialog
        open={editing}
        onOpenChange={setEditing}
        {...(detail ? { initial: detail } : {})}
      />
      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${detail.name}?`}
        description="This removes the product and its SUPPLIED_BY/USES relationships. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={() => {
          del.mutateAsync(detail.id).then(() => navigate("/products"));
        }}
      />
    </>
  );
}
