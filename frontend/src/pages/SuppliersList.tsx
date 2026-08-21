import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuppliers } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { Badge } from "@/components/ui/badge";
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

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Name", render: (s) => <span className="font-medium">{s.name}</span> },
    {
      key: "rating",
      header: "Rating",
      render: (s) => <Badge variant={ratingVariant(s.rating)}>{formatRating(s.rating)}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Suppliers" description={`${data?.data.total ?? 0} suppliers`} />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.data.length === 0 ? (
        <EmptyState message="No suppliers in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data.data}
            columns={columns}
            rowKey={(s) => s.id}
            onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
          />
          <Pagination
            page={data.data.page}
            pageSize={data.data.pageSize}
            total={data.data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </>
  );
}
