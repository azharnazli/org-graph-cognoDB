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
import { Field, TextField } from "@/components/forms/Field";
import { mutations } from "@/lib/mutations";
import type { Product, ProductDetail } from "@org-graph/shared-types";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // List pages pass Product; detail pages pass ProductDetail.
  initial?: Product | ProductDetail;
  onSaved?: () => void;
}

export function ProductDialog({ open, onOpenChange, initial, onSaved }: ProductDialogProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = mutations.product.create();
  const update = mutations.product.update();

  // Reset form when the dialog opens with a different entity.
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setSku(initial?.sku ?? "");
    setCategory(initial?.category ?? "");
    setError(null);
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = { name: name.trim(), sku: sku.trim(), category: category.trim() };
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
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Editing ${initial!.name}` : "Add a product to the supply graph."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name" htmlFor="prd-name">
            <TextField id="prd-name" value={name} onChange={setName} required />
          </Field>
          <Field label="SKU" htmlFor="prd-sku">
            <TextField id="prd-sku" value={sku} onChange={setSku} required />
          </Field>
          <Field label="Category" htmlFor="prd-cat">
            <TextField id="prd-cat" value={category} onChange={setCategory} required />
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
