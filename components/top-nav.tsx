import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
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

export function TopNav({ profile }: { profile: Profile | null }) {
  const isDoctor = profile?.role === "doctor";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={profile ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-semibold"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </span>
          <span className="tracking-tight">MediBook</span>
        </Link>

        {profile ? (
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/doctors">
              <Button variant="ghost" size="sm">Doctors</Button>
            </Link>
            {isDoctor && (
              <Link href="/availability">
                <Button variant="ghost" size="sm">Availability</Button>
              </Link>
            )}
            <Link href="/appointments">
              <Button variant="ghost" size="sm">Appointments</Button>
            </Link>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-2 h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{initials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{profile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-sm font-medium">{profile.name}</span>
                  <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
                </div>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-left">Sign out</button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
