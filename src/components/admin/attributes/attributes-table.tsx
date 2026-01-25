import {
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
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

import type { Attribute } from "./types";
import { getTypeIcon, getTypeLabel } from "./utils";

type AttributesTableProps = {
  attributes: Attribute[] | undefined;
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (attribute: Attribute) => void;
  onDelete: (attribute: Attribute) => void;
};

export function AttributesTable({
  attributes,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: AttributesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customization Attributes</CardTitle>
        <CardDescription>{attributes?.length ?? 0} attributes</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : attributes?.length === 0 ? (
          <div className="text-center py-12">
            <Settings2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No attributes yet</h3>
            <p className="text-muted-foreground">
              Create your first attribute to enable product customization.
            </p>
            <Button className="mt-4" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="text-center">Categories</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes?.map((attr) => (
                <TableRow key={attr.id}>
                  <TableCell className="font-medium">{attr.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(attr.attributeType)}
                      <span>{getTypeLabel(attr.attributeType)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {attr.options && attr.options.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {attr.options.slice(0, 3).map((opt) => (
                          <Badge key={opt} variant="outline" className="text-xs">
                            {opt}
                          </Badge>
                        ))}
                        {attr.options.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{attr.options.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{attr.categoryCount}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{attr.productCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(attr)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(attr)}
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
