import { useState } from "react";
import { useLocations } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@org-graph/shared-types";

export function LocationsListPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useLocations({ page, pageSize });

  const columns: Column<Location>[] = [
    { key: "city", header: "City", render: (l) => <span className="font-medium">{l.city}</span> },
    { key: "country", header: "Country", render: (l) => l.country },
    {
      key: "region",
      header: "Region",
      render: (l) => <Badge variant="secondary">{l.region}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Locations" description={`${data?.data.total ?? 0} locations`} />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.data.length === 0 ? (
        <EmptyState message="No locations in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data.data}
            columns={columns}
            rowKey={(l) => l.id}
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
