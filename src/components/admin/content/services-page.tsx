import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { DeleteServiceDialog } from "./delete-service-dialog";
import { ServiceFormDialog } from "./service-form-dialog";
import { ServicesTable } from "./services-table";
import { useServiceMutations, useServices } from "./services-hooks";
import type { Service } from "./services-types";

export default function ServicesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Service | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<Service | null>(null);

  const { data: items, isLoading, error } = useServices();
  const { deleteMut } = useServiceMutations();

  const handleFormSuccess = () => {
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => setDeletingItem(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage company services</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load services.</p>
          </CardContent>
        </Card>
      )}

      <ServicesTable
        items={items}
        isLoading={isLoading}
        onAdd={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onEdit={(item) => {
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onDelete={(item) => setDeletingItem(item)}
      />

      <ServiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      <DeleteServiceDialog
        item={deletingItem}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
