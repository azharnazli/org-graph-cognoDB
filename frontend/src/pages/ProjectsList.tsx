import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectStatusVariant, PROJECT_STATUS_LABEL } from "@/lib/format";
import type { Project, ProjectStatus } from "@org-graph/shared-types";

const STATUSES: ProjectStatus[] = ["planned", "active", "done"];

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const pageSize = 20;

  const { data, isLoading, error } = useProjects({ page, pageSize, ...(status ? { status } : {}) });

  const columns: Column<Project>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <Badge variant={projectStatusVariant(p.status)}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${data?.total ?? 0} projects${status ? ` (${PROJECT_STATUS_LABEL[status]})` : ""}`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant={status === "" ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatus(""); setPage(1); }}
        >
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {PROJECT_STATUS_LABEL[s]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} />
      ) : data && data.data.length === 0 ? (
        <EmptyState message={status ? `No ${PROJECT_STATUS_LABEL[status].toLowerCase()} projects.` : "No projects in the graph."} />
      ) : data ? (
        <>
          <DataTable
            rows={data.data}
            columns={columns}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/projects/${p.id}`)}
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
