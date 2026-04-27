import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CaseStudyFormDialog } from "./case-study-form-dialog";
import { CaseStudiesTable } from "./case-studies-table";
import { DeleteCaseStudyDialog } from "./delete-case-study-dialog";
import { useCaseStudies, useCaseStudyMutations } from "./case-studies-hooks";
import type { CaseStudy } from "./case-studies-types";

export default function CaseStudiesPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CaseStudy | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<CaseStudy | null>(
    null,
  );

  const { data: items, isLoading, error } = useCaseStudies();
  const { deleteMut } = useCaseStudyMutations();

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
          <h1 className="text-3xl font-bold tracking-tight">Case Studies</h1>
          <p className="text-muted-foreground">Manage product case studies</p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Case Study
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load case studies.</p>
          </CardContent>
        </Card>
      )}

      <CaseStudiesTable
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

      <CaseStudyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      <DeleteCaseStudyDialog
        item={deletingItem}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
