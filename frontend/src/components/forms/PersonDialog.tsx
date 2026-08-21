import { useState } from "react";
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
import { mutations } from "@/lib/mutations";
import type { Person, Role } from "@org-graph/shared-types";

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Person;
  onSaved?: () => void;
}

interface RolesResult {
  data: Role[];
}

export function PersonDialog({ open, onOpenChange, initial, onSaved }: PersonDialogProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [joinedAt, setJoinedAt] = useState(initial?.joinedAt ?? "");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [reportsToId, setReportsToId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const depts = useDepartments({ page: 1, pageSize: 200 });
  const people = usePeople({ page: 1, pageSize: 200 });
  const roles = useQuery<RolesResult>({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<RolesResult>("/api/roles")).data,
  });

  const create = mutations.person.create();
  const update = mutations.person.update();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = {
      name: name.trim(),
      email: email.trim(),
      title: title.trim(),
      joinedAt,
      departmentId: departmentId || null,
      roleId: roleId || null,
      reportsToId: reportsToId || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit person" : "New person"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${initial!.name}` : "Add a person to the org graph."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="p-name">
              <TextField id="p-name" value={name} onChange={setName} required />
            </Field>
            <Field label="Title" htmlFor="p-title">
              <TextField id="p-title" value={title} onChange={setTitle} required />
            </Field>
          </div>
          <Field label="Email" htmlFor="p-email">
            <TextField id="p-email" type="email" value={email} onChange={setEmail} required />
          </Field>
          <Field label="Joined" htmlFor="p-joined">
            <TextField id="p-joined" type="date" value={joinedAt} onChange={setJoinedAt} required />
          </Field>
          <Field label="Department" htmlFor="p-dept">
            <SelectField
              id="p-dept"
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="— none —"
              options={(depts.data?.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
            />
          </Field>
          <Field label="Role" htmlFor="p-role">
            <SelectField
              id="p-role"
              value={roleId}
              onChange={setRoleId}
              placeholder="— none —"
              options={(roles.data?.data ?? []).map((r) => ({
                value: r.id,
                label: r.level,
              }))}
            />
          </Field>
          <Field
            label="Reports to"
            htmlFor="p-mgr"
            {...(isEdit ? { hint: "Self is excluded automatically" } : {})}
          >
            <SelectField
              id="p-mgr"
              value={reportsToId}
              onChange={setReportsToId}
              placeholder="— none —"
              options={(people.data?.data ?? [])
                .filter((p) => p.id !== initial?.id)
                .map((p) => ({ value: p.id, label: `${p.name} (${p.title})` }))}
            />
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
