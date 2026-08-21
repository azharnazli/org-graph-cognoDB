import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Button } from "@/components/ui/button";
import { ProductDialog } from "@/components/forms/ProductDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import type { Product } from "@org-graph/shared-types";

export function ProductsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useProducts({ page, pageSize });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const del = mutations.product.delete();

  const onConfirmDelete = () => {
    if (!deleting) return;
    del.mutateAsync(deleting.id).then(() => setDeleting(null));
  };

  const columns: Column<Product>[] = [
    { key: "sku", header: "SKU", render: (p) => <span className="font-mono text-xs">{p.sku}</span> },
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <span className="flex items-center gap-2">
          <StationDot color={entityAccent("Product")} />
          <span className="font-medium">{p.name}</span>
        </span>
      ),
    },
    { key: "category", header: "Category", render: (p) => <span className="text-muted-foreground">{p.category}</span> },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description={`${data?.total ?? 0} products`}
        accent={entityAccent("Product")}
      >
        <Button onClick={() => setCreating(true)}>+ New</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message="No products in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data}
            columns={columns}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/products/${p.id}`)}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <ProductDialog open={creating} onOpenChange={setCreating} />
      <ProductDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} {...(editing ? { initial: editing } : {})} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "product"}?`}
        description="This removes the product and its SUPPLIED_BY/USES relationships. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
