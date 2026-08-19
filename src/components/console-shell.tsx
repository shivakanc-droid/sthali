import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AppSidebar, type AppSidebarProps } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type ConsoleShellProps = {
  breadcrumb: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  sidebar: AppSidebarProps;
  contentClassName?: string;
};

export function ConsoleShell({
  breadcrumb,
  headerActions,
  children,
  sidebar,
  contentClassName
}: ConsoleShellProps) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Toaster />
      <AppSidebar {...sidebar} />
      <SidebarInset className="sthali-shell">
        <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
          <div className="min-w-0 flex-1">{breadcrumb}</div>
          {headerActions ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">{headerActions}</div>
          ) : null}
        </header>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-5 sm:px-6",
            contentClassName
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
