import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuppliers } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "@/components/forms/SupplierDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { formatRating } from "@/lib/format";
import type { Supplier } from "@org-graph/shared-types";

function ratingVariant(rating: number): "default" | "secondary" | "destructive" | "outline" {
  if (rating >= 4.5) return "default";
  if (rating >= 4.0) return "secondary";
  if (rating >= 3.5) return "outline";
  return "destructive";
}

export function SuppliersListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useSuppliers({ page, pageSize });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const del = mutations.supplier.delete();

  const onConfirmDelete = () => {
    if (!deleting) return;
    del.mutateAsync(deleting.id).then(() => setDeleting(null));
  };

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: "Name",
      render: (s) => (
        <span className="flex items-center gap-2">
          <StationDot color={entityAccent("Supplier")} />
          <span className="font-medium">{s.name}</span>
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (s) => <Badge variant={ratingVariant(s.rating)}>{formatRating(s.rating)}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (s) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(s)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Suppliers"
        description={`${data?.total ?? 0} suppliers`}
        accent={entityAccent("Supplier")}
      >
        <Button onClick={() => setCreating(true)}>+ New</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message="No suppliers in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data}
            columns={columns}
            rowKey={(s) => s.id}
            onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <SupplierDialog open={creating} onOpenChange={setCreating} />
      <SupplierDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} {...(editing ? { initial: editing } : {})} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "supplier"}?`}
        description="This removes the supplier and any product-supply edges. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
