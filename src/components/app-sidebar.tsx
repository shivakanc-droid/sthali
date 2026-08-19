import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator
} from "@/components/ui/sidebar";
import {
  consoleExternalLinks,
  consoleNavGroups,
  type ConsoleView
} from "@/lib/console-nav";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type AppSidebarProps = {
  activeView?: ConsoleView | null;
  activeExternal?: (typeof consoleExternalLinks)[number]["id"] | null;
  onNavigate?: (view: ConsoleView) => void;
  agentCount?: number;
  inboxCount?: number;
  capabilityCount?: number;
};

export function AppSidebar({
  activeView = null,
  activeExternal = null,
  onNavigate,
  agentCount = 0,
  inboxCount = 0,
  capabilityCount = 0
}: AppSidebarProps) {
  const badges: Partial<Record<ConsoleView, string>> = {
    explore: String(agentCount),
    inbox: inboxCount > 0 ? String(inboxCount) : undefined,
    roadmap: capabilityCount > 0 ? String(capabilityCount) : undefined
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-3">
        <a href="/" className="flex items-center gap-2.5 px-1 outline-none">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            S
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-heading truncate text-sm font-semibold tracking-normal">Sthali</p>
            <p className="truncate text-xs text-sidebar-foreground/70">Agent Exchange V0</p>
          </div>
        </a>
      </SidebarHeader>

      <SidebarContent>
        {consoleNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const badge = badges[item.id];
                  const isActive = activeView === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      {onNavigate ? (
                        <SidebarMenuButton
                          type="button"
                          isActive={isActive}
                          tooltip={item.label}
                          onClick={() => onNavigate(item.id)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                          {badge ? (
                            <span className="ml-auto text-[10px] tracking-wide text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                              {badge}
                            </span>
                          ) : null}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          render={<a href={`/?view=${item.id}`} />}
                        >
                          <Icon />
                          <span>{item.label}</span>
                          {badge ? (
                            <span className="ml-auto text-[10px] tracking-wide text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                              {badge}
                            </span>
                          ) : null}
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border">
        <SidebarSeparator className="mx-0" />
        <SidebarMenu>
          {consoleExternalLinks.map((link) => {
            const Icon = link.icon;
            return (
              <SidebarMenuItem key={link.id}>
                <SidebarMenuButton
                  isActive={activeExternal === link.id}
                  tooltip={link.label}
                  render={<a href={link.href} />}
                >
                  <Icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <a
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mx-1 mb-1 justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          )}
          href="/llms.txt"
        >
          <span className="group-data-[collapsible=icon]:hidden">/llms.txt</span>
          <span className="hidden group-data-[collapsible=icon]:inline">L</span>
        </a>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
