import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDepartments } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Button } from "@/components/ui/button";
import { DepartmentDialog } from "@/components/forms/DepartmentDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import type { Department } from "@org-graph/shared-types";

export function DepartmentsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useDepartments({ page, pageSize });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const del = mutations.department.delete();

  const onConfirmDelete = () => {
    if (!deleting) return;
    del.mutateAsync(deleting.id).then(() => setDeleting(null));
  };

  const columns: Column<Department>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <span className="flex items-center gap-2">
          <StationDot color={entityAccent("Department")} />
          <span className="font-medium">{d.name}</span>
        </span>
      ),
    },
    { key: "costCenter", header: "Cost Center", render: (d) => <span className="text-muted-foreground">{d.costCenter}</span> },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (d) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(d)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        description={`${data?.total ?? 0} departments`}
        accent={entityAccent("Department")}
      >
        <Button onClick={() => setCreating(true)}>+ New</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message="No departments in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data}
            columns={columns}
            rowKey={(d) => d.id}
            onRowClick={(d) => navigate(`/departments/${d.id}`)}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <DepartmentDialog open={creating} onOpenChange={setCreating} />
      <DepartmentDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} {...(editing ? { initial: editing } : {})} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "department"}?`}
        description="This removes the department and any attached relationships (people working here, projects owned). This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
