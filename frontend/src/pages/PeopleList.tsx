import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePeople } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { formatDate } from "@/lib/format";
import type { Person } from "@org-graph/shared-types";

export function PeopleListPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = usePeople({ page, pageSize, q });

  const columns: Column<Person>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "title", header: "Title", render: (p) => p.title },
    { key: "email", header: "Email", render: (p) => <span className="text-muted-foreground">{p.email}</span> },
    { key: "joinedAt", header: "Joined", render: (p) => formatDate(p.joinedAt) },
  ];

  return (
    <>
      <PageHeader title="People" description={`${data?.total ?? 0} people in the graph`} />

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
    </>
  );
}
