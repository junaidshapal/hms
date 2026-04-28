import { cookies } from "next/headers";
import { requireProfile } from "@/lib/auth/dal";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar profile={profile} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <span className="text-sm font-medium text-muted-foreground">MediBook</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
