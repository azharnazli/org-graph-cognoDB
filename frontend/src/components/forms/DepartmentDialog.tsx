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
import { useLocations } from "@/lib/list-state";
import { mutations } from "@/lib/mutations";
import type { Department } from "@org-graph/shared-types";

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Department;
  onSaved?: () => void;
}

export function DepartmentDialog({ open, onOpenChange, initial, onSaved }: DepartmentDialogProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [costCenter, setCostCenter] = useState(initial?.costCenter ?? "");
  const [locationId, setLocationId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const locs = useLocations({ page: 1, pageSize: 200 });
  const create = mutations.department.create();
  const update = mutations.department.update();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = {
      name: name.trim(),
      costCenter: costCenter.trim(),
      locationId: locationId || null,
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
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit department" : "New department"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${initial!.name}` : "Add a department to the org graph."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name" htmlFor="dept-name">
            <TextField id="dept-name" value={name} onChange={setName} required />
          </Field>
          <Field label="Cost center" htmlFor="dept-cc" hint="e.g. CC-1000">
            <TextField id="dept-cc" value={costCenter} onChange={setCostCenter} required />
          </Field>
          <Field label="Location" htmlFor="dept-loc" hint="Where the department is based">
            <SelectField
              id="dept-loc"
              value={locationId}
              onChange={setLocationId}
              placeholder="— none —"
              options={(locs.data?.data ?? []).map((l) => ({
                value: l.id,
                label: `${l.city}, ${l.country}`,
              }))}
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
