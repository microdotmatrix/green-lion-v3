import React from "react";
import { CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCatalogDialog } from "./delete-catalog-dialog";
import type { useCatalogMutations } from "./hooks";
import type { Catalog } from "./types";

interface CatalogsTableProps {
  catalogs: Catalog[];
  setActiveMut: ReturnType<typeof useCatalogMutations>["setActiveMut"];
  deleteMut: ReturnType<typeof useCatalogMutations>["deleteMut"];
}

export function CatalogsTable({ catalogs, setActiveMut, deleteMut }: CatalogsTableProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<Catalog | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {catalogs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No catalog versions yet. Upload one to get started.
              </TableCell>
            </TableRow>
          )}
          {catalogs.map((catalog) => (
            <TableRow key={catalog.id}>
              <TableCell className="font-medium">{catalog.displayName}</TableCell>
              <TableCell>
                {catalog.isActive ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(catalog.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={catalog.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </a>
                  </Button>
                  {!catalog.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveMut.mutate(catalog.id)}
                      disabled={setActiveMut.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(catalog)}
                    disabled={deleteMut.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteCatalogDialog
        catalog={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        deleteMut={deleteMut}
      />
    </>
  );
}
