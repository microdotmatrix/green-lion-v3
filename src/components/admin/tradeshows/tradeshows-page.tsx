import { Plus, Users } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { updateRep } from "./api";
import { DeleteRepDialog } from "./delete-rep-dialog";
import { useTradeshowData, useTradeshowRepMutations } from "./hooks";
import { LeadSubmissions } from "./lead-submissions";
import { QrCodeDialog } from "./qr-code-dialog";
import { RepCard } from "./rep-card";
import { RepFormDialog } from "./rep-form-dialog";
import type {
  RepUpdateData,
  TradeshowRep,
  TradeshowRepWithSelections,
} from "./types";

export default function TradeshowsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRep, setEditingRep] = React.useState<TradeshowRep | null>(null);
  const [deletingRep, setDeletingRep] =
    React.useState<TradeshowRepWithSelections | null>(null);
  const [qrCodeRep, setQrCodeRep] =
    React.useState<TradeshowRepWithSelections | null>(null);

  const { data, isLoading, error, refetch } = useTradeshowData();
  const { deleteRepMut } = useTradeshowRepMutations();

  const handleEdit = (rep: TradeshowRepWithSelections) => {
    setEditingRep(rep);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setEditingRep(null);
    refetch();
  };

  const handleDelete = (repId: string) => {
    deleteRepMut.mutate(repId, {
      onSuccess: () => {
        setDeletingRep(null);
        refetch();
      },
    });
  };

  const handleUpdateSelections = async (
    repId: string,
    type: "categories" | "products" | "services",
    ids: string[],
  ) => {
    try {
      const payload: RepUpdateData = {};
      if (type === "categories") payload.categoryIds = ids;
      if (type === "products") payload.productIds = ids;
      if (type === "services") payload.serviceIds = ids;

      await updateRep(repId, payload);
      refetch();
    } catch (err) {
      console.error("Failed to update selections:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Trade Shows</h1>
          <p className="text-muted-foreground">
            Manage sales representatives and their QR codes for lead collection
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRep(null);
            setIsFormOpen(true);
          }}
          className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rep
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">Failed to load data.</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : data?.reps.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No representatives yet
              </h3>
              <p className="text-muted-foreground">
                Add your first trade show representative to get started.
              </p>
              <Button
                className="mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setEditingRep(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rep
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {data?.reps.map((rep) => (
              <RepCard
                key={rep.id}
                rep={rep}
                categories={data.categories}
                products={data.products}
                services={data.services}
                onEdit={handleEdit}
                onDelete={setDeletingRep}
                onQrCode={setQrCodeRep}
                onUpdateSelections={handleUpdateSelections}
              />
            ))}
          </div>

          {data && data.leads.length > 0 && (
            <LeadSubmissions leads={data.leads} reps={data.reps} />
          )}
        </>
      )}

      <RepFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rep={editingRep}
        onSuccess={handleFormSuccess}
      />

      <DeleteRepDialog
        rep={deletingRep}
        isDeleting={deleteRepMut.isPending}
        onOpenChange={(open) => !open && setDeletingRep(null)}
        onDelete={handleDelete}
      />

      <QrCodeDialog
        rep={qrCodeRep}
        open={!!qrCodeRep}
        onOpenChange={(open) => !open && setQrCodeRep(null)}
      />
    </div>
  );
}
