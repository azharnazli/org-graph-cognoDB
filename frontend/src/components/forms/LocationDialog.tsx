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
import { Field, TextField } from "@/components/forms/Field";
import { mutations } from "@/lib/mutations";
import type { Location } from "@org-graph/shared-types";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Location;
  onSaved?: () => void;
}

export function LocationDialog({ open, onOpenChange, initial, onSaved }: LocationDialogProps) {
  const isEdit = Boolean(initial);
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = mutations.location.create();
  const update = mutations.location.update();

  const reset = () => {
    setCity(initial?.city ?? "");
    setCountry(initial?.country ?? "");
    setRegion(initial?.region ?? "");
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = { city: city.trim(), country: country.trim(), region: region.trim() };
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit location" : "New location"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${initial!.city}` : "Add a city to the org graph."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="City" htmlFor="loc-city">
            <TextField id="loc-city" value={city} onChange={setCity} required />
          </Field>
          <Field label="Country" htmlFor="loc-country">
            <TextField id="loc-country" value={country} onChange={setCountry} required />
          </Field>
          <Field label="Region" htmlFor="loc-region" hint="e.g. EMEA, APAC, NA">
            <TextField id="loc-region" value={region} onChange={setRegion} required />
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
