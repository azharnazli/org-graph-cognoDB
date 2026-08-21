import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePeople } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Button } from "@/components/ui/button";
import { PersonDialog } from "@/components/forms/PersonDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { formatDate } from "@/lib/format";
import type { Person } from "@org-graph/shared-types";

export function PeopleListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = usePeople({ page, pageSize, q });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const del = mutations.person.delete();

  const onConfirmDelete = () => {
    if (!deleting) return;
    del.mutateAsync(deleting.id).then(() => {
      setDeleting(null);
    });
  };

  const columns: Column<Person>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <span className="flex items-center gap-2">
          <StationDot color={entityAccent("Person")} />
          <span className="font-medium">{p.name}</span>
        </span>
      ),
    },
    { key: "title", header: "Title", render: (p) => p.title },
    { key: "email", header: "Email", render: (p) => <span className="text-muted-foreground">{p.email}</span> },
    { key: "joinedAt", header: "Joined", render: (p) => formatDate(p.joinedAt) },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (p) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="People"
        description={`${data?.total ?? 0} people in the graph`}
        accent={entityAccent("Person")}
      >
        <Button onClick={() => setCreating(true)}>+ New</Button>
      </PageHeader>

      <div className="mb-4 max-w-md">
        <SearchBar value={q} onChange={(next) => { setQ(next); setPage(1); }} placeholder="Search by name or email..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message={q ? `No people match "${q}".` : "No people in the graph."} />
      ) : data ? (
        <>
          <DataTable
            rows={data.data}
            columns={columns}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/people/${p.id}`)}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <PersonDialog open={creating} onOpenChange={setCreating} />
      <PersonDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        {...(editing ? { initial: editing } : {})}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "person"}?`}
        description="This removes the person and any attached relationships (REPORTS_TO, WORKS_IN, HAS_ROLE, MANAGES). This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
