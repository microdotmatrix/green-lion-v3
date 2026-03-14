import { useState } from "react";

import { useAllAttributes } from "@/components/admin/categories/hooks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useProductAttributeMutations } from "./hooks";

type AssignAttributeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  existingProductAttributeIds: string[];
  categoryAttributeIds: string[];
};

export function AssignAttributeDialog({
  open,
  onOpenChange,
  productId,
  existingProductAttributeIds,
  categoryAttributeIds,
}: AssignAttributeDialogProps) {
  const [selectedAttributeId, setSelectedAttributeId] = useState("");
  const [required, setRequired] = useState(false);
  const [additionalCost, setAdditionalCost] = useState("0");
  const [supportedOptions, setSupportedOptions] = useState<string[]>([]);

  const { data: allAttributes } = useAllAttributes();
  const { assignMut } = useProductAttributeMutations(productId);

  const availableAttributes = (allAttributes ?? []).filter(
    (attr) => !existingProductAttributeIds.includes(attr.id),
  );

  const selectedAttr = availableAttributes.find(
    (a) => a.id === selectedAttributeId,
  );

  const isSelectType =
    selectedAttr?.attributeType === "select" ||
    selectedAttr?.attributeType === "multi_select";

  function handleOptionToggle(option: string, checked: boolean) {
    setSupportedOptions((prev) =>
      checked ? [...prev, option] : prev.filter((o) => o !== option),
    );
  }

  async function handleSubmit() {
    if (!selectedAttributeId) return;

    await assignMut.mutateAsync({
      attributeId: selectedAttributeId,
      required,
      additionalCost,
      supportedOptions: supportedOptions.length > 0 ? supportedOptions : null,
    });

    // Reset state and close on success
    setSelectedAttributeId("");
    setRequired(false);
    setAdditionalCost("0");
    setSupportedOptions([]);
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedAttributeId("");
      setRequired(false);
      setAdditionalCost("0");
      setSupportedOptions([]);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Attribute</DialogTitle>
          <DialogDescription>
            Assign a customization attribute to this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Attribute picker */}
          <div className="space-y-2">
            <Label htmlFor="attribute-select">Attribute</Label>
            <Select
              value={selectedAttributeId}
              onValueChange={(val) => {
                setSelectedAttributeId(val);
                setSupportedOptions([]);
              }}
            >
              <SelectTrigger id="attribute-select">
                <SelectValue placeholder="Select an attribute..." />
              </SelectTrigger>
              <SelectContent>
                {availableAttributes.map((attr) => {
                  const alsoOnCategory = categoryAttributeIds.includes(attr.id);
                  return (
                    <SelectItem key={attr.id} value={attr.id}>
                      <span className="flex items-center gap-2">
                        <span>
                          {attr.name}
                          {alsoOnCategory && (
                            <span className="text-muted-foreground">
                              {" "}
                              (also on category)
                            </span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs ml-1">
                          {getTypeLabel(attr.attributeType)}
                        </Badge>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration fields — shown after attribute selected */}
          {selectedAttr && (
            <>
              {/* Required toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="required-switch">Required</Label>
                <Switch
                  id="required-switch"
                  checked={required}
                  onCheckedChange={setRequired}
                />
              </div>

              {/* Additional cost */}
              <div className="space-y-2">
                <Label htmlFor="additional-cost">Additional Cost</Label>
                <Input
                  id="additional-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                />
              </div>

              {/* Supported options — only for select types */}
              {isSelectType && selectedAttr.options && selectedAttr.options.length > 0 && (
                <div className="space-y-2">
                  <Label>Supported Options</Label>
                  <div className="space-y-2 rounded-md border p-3">
                    {selectedAttr.options.map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <Checkbox
                          id={`option-${option}`}
                          checked={supportedOptions.includes(option)}
                          onCheckedChange={(checked) =>
                            handleOptionToggle(option, !!checked)
                          }
                        />
                        <Label htmlFor={`option-${option}`} className="font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Inline error */}
          {assignMut.error && (
            <p className="text-sm text-destructive">
              {assignMut.error instanceof Error
                ? assignMut.error.message
                : "Failed to assign attribute"}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMut.isPending || !selectedAttributeId}
          >
            {assignMut.isPending ? "Assigning..." : "Assign Attribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
