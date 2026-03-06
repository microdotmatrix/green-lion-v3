import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCatalog, deleteCatalog, fetchCatalogs, setActiveCatalog } from "./api";
import type { CatalogFormData } from "./types";

export function useCatalogs() {
  return useQuery({
    queryKey: ["admin-catalogs"],
    queryFn: fetchCatalogs,
  });
}

export function useCatalogMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-catalogs"] });

  const createCatalogMut = useMutation({
    mutationFn: (data: CatalogFormData) => createCatalog(data),
    onSuccess: () => {
      invalidate();
      toast.success("Catalog version added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setActiveMut = useMutation({
    mutationFn: (id: string) => setActiveCatalog(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catalog set as active");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCatalog(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catalog version deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createCatalogMut, setActiveMut, deleteMut };
}
