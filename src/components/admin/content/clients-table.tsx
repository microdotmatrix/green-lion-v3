import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ClientLogo } from "./clients-types";

type ClientsTableProps = {
  items: ClientLogo[] | undefined;
  isLoading: boolean;
  getFeaturedChecked: (item: ClientLogo) => boolean;
  isFeatureTogglePending: (id: string) => boolean;
  onAdd: () => void;
  onEdit: (item: ClientLogo) => void;
  onToggleFeatured: (item: ClientLogo, checked: boolean) => void;
  onDelete: (item: ClientLogo) => void;
};

export function ClientsTable({
  items,
  isLoading,
  getFeaturedChecked,
  isFeatureTogglePending,
  onAdd,
  onEdit,
  onToggleFeatured,
  onDelete,
}: ClientsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Logos</CardTitle>
        <CardDescription>{items?.length ?? 0} clients</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items?.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
            <Button className="mt-4" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => {
                const isFeatured = getFeaturedChecked(item);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={item.logoUrl}
                        alt={item.companyName}
                        className="h-10 w-20 object-contain bg-white rounded p-1"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:underline"
                        onClick={() => onEdit(item)}
                      >
                        {item.companyName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        aria-label={`Toggle featured for ${item.companyName}`}
                        checked={isFeatured}
                        disabled={isFeatureTogglePending(item.id)}
                        onCheckedChange={(checked) =>
                          onToggleFeatured(item, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={item.externalLink}
                              target="_blank"
                              rel="noopener"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
