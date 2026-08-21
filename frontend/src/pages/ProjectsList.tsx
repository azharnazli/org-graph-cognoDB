import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/lib/list-state";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { DataTable, type Column } from "@/components/common/DataTable";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/DataState";
import { StationDot } from "@/components/common/StationDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/forms/ProjectDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { mutations } from "@/lib/mutations";
import { entityAccent } from "@/lib/graph-colors";
import { projectStatusVariant, PROJECT_STATUS_LABEL } from "@/lib/format";
import type { Project, ProjectStatus } from "@org-graph/shared-types";

const STATUSES: ProjectStatus[] = ["planned", "active", "done"];

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const pageSize = 20;

  const { data, isLoading, error } = useProjects({ page, pageSize, ...(status ? { status } : {}) });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const del = mutations.project.delete();

  const onConfirmDelete = () => {
    if (!deleting) return;
    del.mutateAsync(deleting.id).then(() => setDeleting(null));
  };

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <span className="flex items-center gap-2">
          <StationDot color={entityAccent("Project")} />
          <span className="font-medium">{p.name}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <Badge variant={projectStatusVariant(p.status)}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      render: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${data?.total ?? 0} projects${status ? ` (${PROJECT_STATUS_LABEL[status]})` : ""}`}
        accent={entityAccent("Project")}
      >
        <Button onClick={() => setCreating(true)}>+ New</Button>
      </PageHeader>

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

      <ProjectDialog open={creating} onOpenChange={setCreating} />
      <ProjectDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} {...(editing ? { initial: editing } : {})} />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "project"}?`}
        description="This removes the project and its USES/MANAGES relationships. This cannot be undone."
        isDeleting={del.isPending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
