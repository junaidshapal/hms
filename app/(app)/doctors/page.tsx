import Link from "next/link";
import { ArrowRight, Award, Sparkles, Stethoscope, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type DoctorRow = {
  id: string;
  specialization: string;
  bio: string | null;
  years_experience: number | null;
  profile: { name: string } | { name: string }[] | null;
};

export default async function DoctorsPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: doctors = [] } = await supabase
    .from("doctors")
    .select("id, specialization, bio, years_experience, profile:profiles!inner(name)")
    .order("created_at", { ascending: false });

  const list = (doctors ?? []) as DoctorRow[];
  const specializations = Array.from(new Set(list.map((d) => d.specialization))).sort();
  const totalOpenSlots = await getTotalOpenSlots(list.map((d) => d.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header>
        <p className="text-sm text-muted-foreground">Browse</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Find a doctor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a specialist and request an appointment in two clicks.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Doctors" value={list.length} icon={Users} />
        <StatTile label="Specializations" value={specializations.length} icon={Award} />
        <StatTile label="Open slots" value={totalOpenSlots} icon={Sparkles} />
      </div>

      {specializations.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Specializations
          </span>
          {specializations.map((s) => (
            <Badge key={s} variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {s}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="my-6" />

      {list.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Stethoscope}
              title="No doctors registered yet"
              description="Once doctors create their profile, they'll appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => {
            const profileObj = Array.isArray(d.profile) ? d.profile[0] : d.profile;
            const name = profileObj?.name ?? "Doctor";
            return <DoctorCard key={d.id} id={d.id} name={name} doctor={d} />;
          })}
        </div>
      )}
    </div>
  );
}

async function getTotalOpenSlots(doctorIds: string[]): Promise<number> {
  if (doctorIds.length === 0) return 0;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .in("doctor_id", doctorIds)
    .eq("is_booked", false)
    .gte("date", today);
  return count ?? 0;
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function DoctorCard({
  id,
  name,
  doctor,
}: {
  id: string;
  name: string;
  doctor: DoctorRow;
}) {
  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent"
      />
      <CardContent className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 ring-4 ring-background">
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-base font-semibold">Dr. {name}</h3>
            <Badge variant="secondary" className="mt-1.5 capitalize">
              {doctor.specialization}
            </Badge>
          </div>
        </div>

        {doctor.bio ? (
          <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{doctor.bio}</p>
        ) : (
          <p className="mt-4 line-clamp-2 text-sm italic text-muted-foreground/70">
            No bio yet.
          </p>
        )}

        <div className="mt-auto pt-4">
          {doctor.years_experience != null && (
            <p className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              {doctor.years_experience} yrs experience
            </p>
          )}
          <Link href={`/doctors/${id}`}>
            <Button className="w-full justify-between" size="sm">
              View profile & book
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
