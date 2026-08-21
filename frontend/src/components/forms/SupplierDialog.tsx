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
import { useLocations } from "@/lib/list-state";
import { mutations } from "@/lib/mutations";
import type { Supplier, SupplierDetail } from "@org-graph/shared-types";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Supplier | SupplierDetail;
  onSaved?: () => void;
}

export function SupplierDialog({ open, onOpenChange, initial, onSaved }: SupplierDialogProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [rating, setRating] = useState(initial?.rating?.toString() ?? "0");
  const [locationId, setLocationId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const locs = useLocations({ page: 1, pageSize: 200 });
  const create = mutations.supplier.create();
  const update = mutations.supplier.update();

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setRating(initial?.rating?.toString() ?? "0");
    setLocationId(initial && "location" in initial ? initial.location?.id ?? "" : "");
    setError(null);
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ratingNum = Number(rating);
    if (Number.isNaN(ratingNum)) {
      setError("Rating must be a number");
      return;
    }
    const body = { name: name.trim(), rating: ratingNum, locationId: locationId || null };
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
          <DialogTitle>{isEdit ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${initial!.name}` : "Add a supplier to the supply graph."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name" htmlFor="sup-name">
            <TextField id="sup-name" value={name} onChange={setName} required />
          </Field>
          <Field label="Rating" htmlFor="sup-rating" hint="0.0 – 5.0">
            <TextField
              id="sup-rating"
              type="number"
              value={rating}
              onChange={setRating}
              min={0}
              max={5}
              step={0.1}
              required
            />
          </Field>
          <Field label="Location" htmlFor="sup-loc" hint="Where the supplier is based">
            <SelectField
              id="sup-loc"
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
