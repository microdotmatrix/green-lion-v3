import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
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

import type { TradeshowRep } from "./types";

type RepsTableProps = {
  reps: TradeshowRep[] | undefined;
  isLoading: boolean;
  onView: (repId: string) => void;
  onEdit: (rep: TradeshowRep) => void;
  onDelete: (rep: TradeshowRep) => void;
  onAdd: () => void;
};

export function RepsTable({
  reps,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: RepsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Representatives</CardTitle>
        <CardDescription>{reps?.length ?? 0} representatives</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : reps?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No representatives yet
            </h3>
            <p className="text-muted-foreground">
              Add your first trade show representative.
            </p>
            <Button className="mt-4" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Representative
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Leads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reps?.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium">{rep.name}</TableCell>
                  <TableCell>{rep.company}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{rep.email}</p>
                      <p className="text-muted-foreground">{rep.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{rep.leadCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rep.active ? "default" : "outline"}>
                      {rep.active ? "Active" : "Inactive"}
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
                        <DropdownMenuItem onClick={() => onView(rep.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(rep)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(rep)}
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
