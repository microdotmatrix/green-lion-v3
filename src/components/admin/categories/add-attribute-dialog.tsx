import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAllAttributes, useCategoryAttributeMutations } from "./hooks";
import { getTypeLabel } from "./utils";

type AddAttributeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  existingAttributeIds: string[];
};

export function AddAttributeDialog({
  open,
  onOpenChange,
  categoryId,
  existingAttributeIds,
}: AddAttributeDialogProps) {
  const [selectedAttributeId, setSelectedAttributeId] =
    React.useState<string>("");
  const { data: allAttributes } = useAllAttributes();
  const { assignMut } = useCategoryAttributeMutations(categoryId);

  const availableAttributes = allAttributes?.filter(
    (attr) => !existingAttributeIds.includes(attr.id),
  );

  const handleAssign = async () => {
    if (!selectedAttributeId) return;
    try {
      await assignMut.mutateAsync(selectedAttributeId);
      setSelectedAttributeId("");
      onOpenChange(false);
    } catch {
      // Error shown via mutation state
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Attribute</DialogTitle>
          <DialogDescription>
            Assign an attribute to this category. Products in this category will
            inherit these customization options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {assignMut.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {assignMut.error instanceof Error
                ? assignMut.error.message
                : "Something went wrong"}
            </div>
          )}

          <Select
            value={selectedAttributeId}
            onValueChange={setSelectedAttributeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an attribute..." />
            </SelectTrigger>
            <SelectContent>
              {availableAttributes?.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No available attributes
                </div>
              ) : (
                availableAttributes?.map((attr) => (
                  <SelectItem key={attr.id} value={attr.id}>
                    <div className="flex items-center gap-2">
                      <span>{attr.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(attr.attributeType)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedAttributeId || assignMut.isPending}
          >
            {assignMut.isPending ? "Adding..." : "Add Attribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
