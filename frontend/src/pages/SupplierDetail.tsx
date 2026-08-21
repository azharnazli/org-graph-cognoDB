import { Link, useParams } from "react-router-dom";
import { useSupplier } from "@/lib/detail-hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/DataState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRating } from "@/lib/format";

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supplierId = id ?? "";
  const { data, isLoading, error } = useSupplier(supplierId);

  const detail = data?.data;

  if (isLoading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />;
  if (!detail) return <ErrorState message="Supplier not found." />;

  return (
    <>
      <PageHeader title={detail.name}>
        <Badge variant="outline">Rating {formatRating(detail.rating)}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
