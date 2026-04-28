"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/supabase/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const PATIENT_PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Find a doctor", icon: Stethoscope },
  { href: "/appointments", label: "My appointments", icon: ClipboardList },
];

const DOCTOR_PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/availability", label: "Availability", icon: CalendarClock },
  { href: "/appointments", label: "Appointments", icon: ClipboardList },
  { href: "/doctors", label: "Browse doctors", icon: Users },
];

export function AppSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const isDoctor = profile.role === "doctor";
  const items = isDoctor ? DOCTOR_PRIMARY : PATIENT_PRIMARY;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center border-b p-0">
        <Link
          href="/dashboard"
          className="flex h-full w-full items-center gap-2 px-3 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">MediBook</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isDoctor ? "Doctor" : "Patient"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(href)}
                    tooltip={label}
                    className="h-10"
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={profile.name}>
                  <Avatar className="h-7 w-7 rounded-md">
                    <AvatarFallback className="rounded-md text-xs">
                      {initials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{profile.name}</span>
                    <span className="truncate text-xs capitalize text-muted-foreground">
                      {profile.role}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                className="w-56"
              >
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-sm font-medium">{profile.name}</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-left">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
