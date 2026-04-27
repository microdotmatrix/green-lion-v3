import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CatalogUploadDialog } from "./catalog-upload-dialog";
import { useCatalogMutations, useCatalogs } from "./hooks";
import { CatalogsTable } from "./catalogs-table";

const queryClient = new QueryClient();

function CatalogsPageInner() {
  const { data: catalogs = [], isLoading } = useCatalogs();
  const { createCatalogMut, setActiveMut, deleteMut } = useCatalogMutations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Product Catalogs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage PDF catalog versions. Only one version is active at a time.
          </p>
        </div>
        <CatalogUploadDialog createCatalogMut={createCatalogMut} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : (
        <CatalogsTable
          catalogs={catalogs}
          setActiveMut={setActiveMut}
          deleteMut={deleteMut}
        />
      )}
    </div>
  );
}

export function CatalogsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogsPageInner />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
