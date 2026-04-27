import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { DeleteTestimonialDialog } from "./delete-testimonial-dialog";
import { TestimonialFormDialog } from "./testimonial-form-dialog";
import { TestimonialsTable } from "./testimonials-table";
import { useTestimonialMutations, useTestimonials } from "./testimonials-hooks";
import type { Testimonial } from "./testimonials-types";

export default function TestimonialsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Testimonial | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = React.useState<Testimonial | null>(
    null,
  );

  const { data: items, isLoading, error } = useTestimonials();
  const { deleteMut } = useTestimonialMutations();

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage customer testimonials</p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load testimonials.</p>
          </CardContent>
        </Card>
      )}

      <TestimonialsTable
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

      <TestimonialFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      <DeleteTestimonialDialog
        item={deletingItem}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
