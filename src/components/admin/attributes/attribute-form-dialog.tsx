import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAttributeMutations } from "./hooks";
import type { Attribute, AttributeFormData, AttributeType } from "./types";

type AttributeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: Attribute | null;
  onSuccess: () => void;
};

export function AttributeFormDialog({
  open,
  onOpenChange,
  attribute,
  onSuccess,
}: AttributeFormDialogProps) {
  const isEditing = !!attribute;
  const { createAttributeMut, updateAttributeMut } = useAttributeMutations();

  const [formData, setFormData] = React.useState<AttributeFormData>({
    name: "",
    attributeType: "text",
    options: [],
  });
  const [optionInput, setOptionInput] = React.useState("");

  React.useEffect(() => {
    if (attribute) {
      setFormData({
        name: attribute.name,
        attributeType: attribute.attributeType,
        options: attribute.options || [],
      });
    } else {
      setFormData({
        name: "",
        attributeType: "text",
        options: [],
      });
    }
    setOptionInput("");
  }, [attribute]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (isEditing && attribute) {
        await updateAttributeMut.mutateAsync({
          id: attribute.id,
          data: formData,
        });
      } else {
        await createAttributeMut.mutateAsync(formData);
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      // Error shown via mutation state
    }
  };

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (trimmed && !formData.options.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, trimmed],
      }));
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== option),
    }));
  };

  const showOptions =
    formData.attributeType === "select" ||
    formData.attributeType === "multi_select";
  const isLoading =
    createAttributeMut.isPending || updateAttributeMut.isPending;
  const error = createAttributeMut.error || updateAttributeMut.error;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent
        onInteractOutside={(event) => event.preventDefault()}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {isEditing ? "Edit Attribute" : "Add Attribute"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {isEditing
              ? "Update attribute properties."
              : "Create a new customization attribute."}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error instanceof Error ? error.message : "Something went wrong"}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g., Color, Size, Material"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.attributeType}
              onValueChange={(value: AttributeType) =>
                setFormData((prev) => ({ ...prev, attributeType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text (free input)</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                <SelectItem value="select">Single Select (dropdown)</SelectItem>
                <SelectItem value="multi_select">
                  Multi Select (checkboxes)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showOptions && (
            <div className="space-y-2">
              <Label>Options *</Label>
              <div className="flex gap-2">
                <Input
                  value={optionInput}
                  onChange={(event) => setOptionInput(event.target.value)}
                  placeholder="Add an option"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddOption}
                >
                  Add
                </Button>
              </div>
              {formData.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.options.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1">
                      {option}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(option)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {showOptions && formData.options.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add at least one option for select types.
                </p>
              )}
            </div>
          )}

          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || (showOptions && formData.options.length === 0)
              }
            >
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
