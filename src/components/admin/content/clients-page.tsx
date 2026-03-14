import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { ClientFormDialog } from "./client-form-dialog";
import { useClientMutations, useClients } from "./clients-hooks";
import { ClientsTable } from "./clients-table";
import type { ClientLogo } from "./clients-types";
import { DeleteClientDialog } from "./delete-client-dialog";

export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ClientLogo | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<ClientLogo | null>(
    null,
  );
  const [featureOverrides, setFeatureOverrides] = React.useState<
    Record<string, boolean | undefined>
  >({});
  const [pendingFeatureIds, setPendingFeatureIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const { data: items, isLoading, error } = useClients();
  const { deleteMut, updateMut } = useClientMutations();

  const featuredCount = items?.filter((i) => i.featuredOnHomepage).length ?? 0;

  const handleFormSuccess = () => {
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => setDeletingItem(null),
    });
  };

  const handleToggleFeatured = (item: ClientLogo, checked: boolean) => {
    setFeatureOverrides((prev) => ({
      ...prev,
      [item.id]: checked,
    }));

    setPendingFeatureIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });

    updateMut.mutate(
      {
        id: item.id,
        data: { featuredOnHomepage: checked },
      },
      {
        onSettled: () => {
          setFeatureOverrides((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });

          setPendingFeatureIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client logos ({featuredCount} featured)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load clients.</p>
          </CardContent>
        </Card>
      )}

      <ClientsTable
        items={items}
        isLoading={isLoading}
        getFeaturedChecked={(item) =>
          featureOverrides[item.id] ?? item.featuredOnHomepage
        }
        isFeatureTogglePending={(id) => pendingFeatureIds.has(id)}
        onAdd={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onEdit={(item) => {
          setEditingItem(item);
          setIsFormOpen(true);
        }}
        onToggleFeatured={handleToggleFeatured}
        onDelete={(item) => setDeletingItem(item)}
      />

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      <DeleteClientDialog
        item={deletingItem}
        isDeleting={deleteMut.isPending}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
