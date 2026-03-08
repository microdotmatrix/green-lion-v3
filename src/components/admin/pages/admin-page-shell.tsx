import * as React from "react";

import { QueryProvider } from "@/components/providers/query-provider";

interface AdminPageShellProps {
  children: React.ReactNode;
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return <QueryProvider>{children}</QueryProvider>;
}
