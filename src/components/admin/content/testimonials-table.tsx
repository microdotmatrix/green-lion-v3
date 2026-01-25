import {
  MessageSquareQuote,
  MoreHorizontal,
  Pencil,
  Plus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Testimonial } from "./testimonials-types";

type TestimonialsTableProps = {
  items: Testimonial[] | undefined;
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: Testimonial) => void;
  onDelete: (item: Testimonial) => void;
};

export function TestimonialsTable({
  items,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: TestimonialsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Testimonials</CardTitle>
        <CardDescription>{items?.length ?? 0} items</CardDescription>
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
            <MessageSquareQuote className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No testimonials yet</h3>
            <Button className="mt-4" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[300px] truncate">
                    {item.quote}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.author}</p>
                      {item.authorTitle && (
                        <p className="text-xs text-muted-foreground">
                          {item.authorTitle}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.companyName}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
