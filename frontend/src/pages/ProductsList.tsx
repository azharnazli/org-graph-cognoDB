import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import type { Product } from "@org-graph/shared-types";

export function ProductsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useProducts({ page, pageSize });

  const columns: Column<Product>[] = [
    { key: "sku", header: "SKU", render: (p) => <span className="font-mono text-xs">{p.sku}</span> },
    { key: "name", header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "category", header: "Category", render: (p) => <span className="text-muted-foreground">{p.category}</span> },
  ];

  return (
    <>
      <PageHeader title="Products" description={`${data?.data.total ?? 0} products`} />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.data.length === 0 ? (
        <EmptyState message="No products in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data.data}
            columns={columns}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/products/${p.id}`)}
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
