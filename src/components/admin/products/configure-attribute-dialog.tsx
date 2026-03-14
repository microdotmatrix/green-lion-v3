import { useEffect, useState } from "react";

import { getTypeLabel } from "@/components/admin/categories/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useProductAttributeMutations } from "./hooks";
import type { ProductAttribute } from "./types";

type ConfigureAttributeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  attribute: ProductAttribute;
};

export function ConfigureAttributeDialog({
  open,
  onOpenChange,
  productId,
  attribute,
}: ConfigureAttributeDialogProps) {
  const [required, setRequired] = useState(attribute.required);
  const [additionalCost, setAdditionalCost] = useState(attribute.additionalCost);
  const [supportedOptions, setSupportedOptions] = useState<string[]>(
    attribute.supportedOptions ?? [],
  );

  // Re-initialize state when attribute changes (dialog reused for different attributes)
  useEffect(() => {
    setRequired(attribute.required);
    setAdditionalCost(attribute.additionalCost);
    setSupportedOptions(attribute.supportedOptions ?? []);
  }, [attribute]);

  const { updateMut, removeMut } = useProductAttributeMutations(productId);

  const isSelectType =
    attribute.attributeType === "select" ||
    attribute.attributeType === "multi_select";

  const isMutating = updateMut.isPending || removeMut.isPending;

  function handleOptionToggle(option: string, checked: boolean) {
    setSupportedOptions((prev) =>
      checked ? [...prev, option] : prev.filter((o) => o !== option),
    );
  }

  async function handleSave() {
    await updateMut.mutateAsync({
      attributeId: attribute.attributeId,
      required,
      additionalCost,
      supportedOptions: supportedOptions.length > 0 ? supportedOptions : null,
    });
    onOpenChange(false);
  }

  async function handleRemove() {
    await removeMut.mutateAsync(attribute.attributeId);
    onOpenChange(false);
  }

  const mutationError = updateMut.error ?? removeMut.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {attribute.attributeName}
            <Badge variant="outline" className="text-xs font-normal">
              {getTypeLabel(attribute.attributeType)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Configure how this attribute behaves on this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="configure-required-switch">Required</Label>
            <Switch
              id="configure-required-switch"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>

          {/* Additional cost */}
          <div className="space-y-2">
            <Label htmlFor="configure-additional-cost">Additional Cost</Label>
            <Input
              id="configure-additional-cost"
              type="number"
              step="0.01"
              min="0"
              value={additionalCost}
              onChange={(e) => setAdditionalCost(e.target.value)}
            />
          </div>

          {/* Supported options — only for select/multi_select types */}
          {isSelectType && attribute.allOptions && attribute.allOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Supported Options</Label>
              <div className="space-y-2 rounded-md border p-3">
                {attribute.allOptions.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={`configure-option-${option}`}
                      checked={supportedOptions.includes(option)}
                      onCheckedChange={(checked) =>
                        handleOptionToggle(option, !!checked)
                      }
                    />
                    <Label
                      htmlFor={`configure-option-${option}`}
                      className="font-normal"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline error */}
          {mutationError && (
            <p className="text-sm text-destructive">
              {mutationError instanceof Error
                ? mutationError.message
                : "An error occurred"}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isMutating}
          >
            {removeMut.isPending ? "Removing..." : "Remove"}
          </Button>
          <Button onClick={handleSave} disabled={isMutating}>
            {updateMut.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
