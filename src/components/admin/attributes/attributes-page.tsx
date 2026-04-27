import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AttributeFormDialog } from "./attribute-form-dialog";
import { AttributesTable } from "./attributes-table";
import { DeleteAttributeDialog } from "./delete-attribute-dialog";
import { useAttributeMutations, useAttributes } from "./hooks";
import type { Attribute } from "./types";

export default function AttributesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAttribute, setEditingAttribute] =
    React.useState<Attribute | null>(null);
  const [deletingAttribute, setDeletingAttribute] =
    React.useState<Attribute | null>(null);

  const { data: attributes, isLoading, error } = useAttributes();
  const { deleteAttributeMut } = useAttributeMutations();

  const handleFormSuccess = () => {
    setEditingAttribute(null);
  };

  const handleDelete = (attributeId: string) => {
    deleteAttributeMut.mutate(attributeId, {
      onSuccess: () => setDeletingAttribute(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
          <p className="text-muted-foreground">
            Manage product customization attributes
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingAttribute(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">
              Failed to load attributes. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      <AttributesTable
        attributes={attributes}
        isLoading={isLoading}
        onAdd={() => {
          setEditingAttribute(null);
          setIsFormOpen(true);
        }}
        onEdit={(attr) => {
          setEditingAttribute(attr);
          setIsFormOpen(true);
        }}
        onDelete={(attr) => setDeletingAttribute(attr)}
      />

      <AttributeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        attribute={editingAttribute}
        onSuccess={handleFormSuccess}
      />

      <DeleteAttributeDialog
        attribute={deletingAttribute}
        isDeleting={deleteAttributeMut.isPending}
        onOpenChange={(open) => !open && setDeletingAttribute(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
