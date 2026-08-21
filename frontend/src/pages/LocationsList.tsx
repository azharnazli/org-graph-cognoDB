import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocations } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationDialog } from "@/components/forms/LocationDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import type { Location } from "@org-graph/shared-types";

export function LocationsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useLocations({ page, pageSize });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const del = mutations.location.delete();

  const onConfirmDelete = () => {
    if (!deleting) return;
    del.mutateAsync(deleting.id).then(() => setDeleting(null));
  };

  const columns: Column<Location>[] = [
    {
      key: "city",
      header: "City",
      render: (l) => (
        <span className="flex items-center gap-2">
          <StationDot color={entityAccent("Location")} />
          <span className="font-medium">{l.city}</span>
        </span>
      ),
    },
    { key: "country", header: "Country", render: (l) => l.country },
    {
      key: "region",
      header: "Region",
      render: (l) => <Badge variant="secondary">{l.region}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (l) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setEditing(l)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(l)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Locations"
        description={`${data?.total ?? 0} locations`}
        accent={entityAccent("Location")}
      >
        <Button onClick={() => setCreating(true)}>+ New</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message="No locations in the graph." />
      ) : data ? (
        <>
          <DataTable
            rows={data.data}
            columns={columns}
            rowKey={(l) => l.id}
            onRowClick={(l) => navigate(`/locations/${l.id}`)}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <LocationDialog open={creating} onOpenChange={setCreating} />
      <LocationDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} {...(editing ? { initial: editing } : {})} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.city ?? "location"}?`}
        description="This removes the location and any supplier/department LOCATED_IN edges. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
