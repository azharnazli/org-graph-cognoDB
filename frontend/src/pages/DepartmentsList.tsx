import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDepartments } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import type { Department } from "@org-graph/shared-types";

export function DepartmentsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useDepartments({ page, pageSize });

  const columns: Column<Department>[] = [
    { key: "name", header: "Name", render: (d) => <span className="font-medium">{d.name}</span> },
    { key: "costCenter", header: "Cost Center", render: (d) => <span className="text-muted-foreground">{d.costCenter}</span> },
  ];

  return (
    <>
      <PageHeader title="Departments" description={`${data?.data.total ?? 0} departments`} />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.data.length === 0 ? (
        <EmptyState message="No departments in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data.data}
            columns={columns}
            rowKey={(d) => d.id}
            onRowClick={(d) => navigate(`/departments/${d.id}`)}
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
