import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextField, SelectField } from "@/components/forms/Field";
import { useDepartments, usePeople } from "@/lib/list-state";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { cn } from "@/lib/utils";
import { mutations } from "@/lib/mutations";
import type { Project, ProjectDetail, ProjectStatus } from "@org-graph/shared-types";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // List pages pass Project; detail pages pass ProjectDetail (which includes
  // department / managers) so the form can pre-fill those.
  initial?: Project | ProjectDetail;
  onSaved?: () => void;
}

interface ManagersResult {
  data: string[];
}

export function ProjectDialog({ open, onOpenChange, initial, onSaved }: ProjectDialogProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "planned");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const depts = useDepartments({ page: 1, pageSize: 200 });
  const people = usePeople({ page: 1, pageSize: 200 });

  // Load current managers when editing so the multi-select starts checked.
  // queryKey includes the project id so a different edit click refetches.
  const initialManagers = useQuery<ManagersResult>({
    queryKey: ["project-managers", initial?.id],
    queryFn: async () =>
      initial?.id
        ? (await api.get<ManagersResult>(`/api/projects/${initial.id}/managers`)).data
        : { data: [] },
    enabled: Boolean(initial?.id) && open,
  });

  const create = mutations.project.create();
  const update = mutations.project.update();

  // Reset form when the dialog opens with a different entity. Also seeds
  // managerIds from the freshly-loaded manager list (ProjectDetail.managers
  // gives us the same data without an extra round trip when available).
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setStatus(initial?.status ?? "planned");
    const detail = initial && "department" in initial ? initial : null;
    setDepartmentId(initial?.departmentId ?? detail?.department?.id ?? "");
    setManagerIds(
      initial && "managers" in initial && Array.isArray(initial.managers)
        ? initial.managers.map((m) => m.id)
        : [],
    );
    setError(null);
  }, [open, initial]);

  // Once the per-project managers endpoint resolves, overwrite managerIds —
  // covers the list-page case where ProjectDetail.managers isn't available.
  useEffect(() => {
    if (!open || !initial?.id) return;
    if (initialManagers.data) {
      setManagerIds(initialManagers.data.data);
    }
  }, [open, initial?.id, initialManagers.data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = {
      name: name.trim(),
      status,
      departmentId: departmentId || null,
      managerIds,
    };
    const next = isEdit
      ? update.mutateAsync({ id: initial!.id, input: body })
      : create.mutateAsync(body);
    next
      .then(() => {
        onSaved?.();
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Save failed");
      });
  };

  const toggleManager = (id: string) => {
    setManagerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${initial!.name}` : "Add a project to the org graph."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name" htmlFor="proj-name">
            <TextField id="proj-name" value={name} onChange={setName} required />
          </Field>
          <Field label="Status" htmlFor="proj-status">
            <SelectField
              id="proj-status"
              value={status}
              onChange={(v) => setStatus(v as ProjectStatus)}
              options={[
                { value: "planned", label: "Planned" },
                { value: "active", label: "Active" },
                { value: "done", label: "Done" },
              ]}
            />
          </Field>
          <Field label="Owning department" htmlFor="proj-dept">
            <SelectField
              id="proj-dept"
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="— none —"
              options={(depts.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
            />
          </Field>
          <Field label="Managers" htmlFor="proj-mgrs" hint="Toggle people who manage this project">
            <div
              id="proj-mgrs"
              className="max-h-48 overflow-y-auto rounded-md border bg-background p-2"
            >
              {(people.data?.data ?? []).map((p) => {
                const checked = managerIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent",
                      checked && "bg-accent",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleManager(p.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{p.name}</span>{" "}
                      <span className="text-xs text-muted-foreground">— {p.title}</span>
                    </span>
                  </label>
                );
              })}
              {people.data?.data.length === 0 ? (
                <p className="p-2 text-xs text-muted-foreground">No people yet.</p>
              ) : null}
            </div>
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
