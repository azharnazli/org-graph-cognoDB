import { Link, useParams } from "react-router-dom";
import { useProduct } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRating } from "@/lib/format";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ?? "";
  const { data, isLoading, error } = useProduct(productId);

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Product not found." />;

  return (
    <>
      <PageHeader title={detail.name} description={detail.sku}>
        <Badge variant="secondary">{detail.category}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <Link className="text-primary hover:underline" to={`/suppliers/${s.id}`}>
                      {s.name}
                    </Link>
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
                  <li key={p.id}>
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
    </>
  );
}
