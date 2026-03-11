import {
  ExternalLink,
  Image,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Service } from "./services-types";

type ServicesTableProps = {
  items: Service[] | undefined;
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: Service) => void;
  onDelete: (item: Service) => void;
};

export function ServicesTable({
  items,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: ServicesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Services</CardTitle>
        <CardDescription>{items?.length ?? 0} services</CardDescription>
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
            <Image className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
            <Button className="mt-4" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:underline"
                      onClick={() => onEdit(item)}
                    >
                      {item.title}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-muted-foreground">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.features?.length || 0} features
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.googleFormUrl && (
                          <DropdownMenuItem asChild>
                            <a
                              href={item.googleFormUrl}
                              target="_blank"
                              rel="noopener"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Form
                            </a>
                          </DropdownMenuItem>
                        )}
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
