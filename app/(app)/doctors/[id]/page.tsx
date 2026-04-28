import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarCheck2,
  CalendarX,
  Clock,
  Mail,
  Stethoscope,
} from "lucide-react";
import { requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatRange } from "@/lib/format";
import { BookSlotButton } from "./_components/book-slot-button";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Slot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id, specialization, bio, years_experience, profile:profiles!inner(name, email)")
    .eq("id", id)
    .maybeSingle();

  if (!doctor) notFound();

  const today = new Date().toISOString().slice(0, 10);

  const { data: slotsData = [] } = await supabase
    .from("availability")
    .select("id, date, start_time, end_time, is_booked")
    .eq("doctor_id", id)
    .gte("date", today)
    .order("date")
    .order("start_time");

  const slots = (slotsData ?? []) as Slot[];
  const availableSlots = slots.filter((s) => !s.is_booked);

  // Hide slots with a pending appointment so two patients can't double-book.
  const slotIds = availableSlots.map((s) => s.id);
  let pendingSlotIds: Set<string> = new Set();
  if (slotIds.length > 0) {
    const { data: pendingApps = [] } = await supabase
      .from("appointments")
      .select("availability_id")
      .in("availability_id", slotIds)
      .eq("status", "pending");
    pendingSlotIds = new Set((pendingApps ?? []).map((a) => a.availability_id));
  }
  const bookable = availableSlots.filter((s) => !pendingSlotIds.has(s.id));

  // Group bookable slots by date, preserving sort order.
  const grouped: Array<[string, Slot[]]> = [];
  const byDate = new Map<string, Slot[]>();
  for (const s of bookable) {
    if (!byDate.has(s.date)) {
      const arr: Slot[] = [];
      byDate.set(s.date, arr);
      grouped.push([s.date, arr]);
    }
    byDate.get(s.date)!.push(s);
  }

  const profileObj = Array.isArray(doctor.profile)
    ? doctor.profile[0]
    : doctor.profile;
  const name = (profileObj as { name: string; email: string } | null)?.name ?? "Doctor";
  const email = (profileObj as { name: string; email: string } | null)?.email ?? null;
  const isPatient = profile.role === "patient";

  const totalOpen = bookable.length;
  const availableDays = grouped.length;
  const nextDate = grouped[0]?.[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to doctors
      </Link>

      {/* Hero */}
      <Card className="mt-4 overflow-hidden">
        <div
          aria-hidden
          className="h-24 w-full"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.22 262) 0%, oklch(0.4 0.2 268) 100%)",
          }}
        />
        <CardContent className="p-6">
          <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 sm:pb-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Dr. {name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <Badge variant="secondary" className="capitalize">
                  <Stethoscope className="mr-1 h-3 w-3" />
                  {doctor.specialization}
                </Badge>
                {doctor.years_experience != null && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Award className="h-3.5 w-3.5" />
                    {doctor.years_experience} yrs experience
                  </span>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {doctor.bio && (
            <>
              <Separator className="my-5" />
              <p className="text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Open slots" value={totalOpen} icon={Clock} />
        <StatTile label="Available days" value={availableDays} icon={CalendarCheck2} />
        <StatTile
          label="Next available"
          value={nextDate ? formatDate(nextDate) : "—"}
          icon={CalendarCheck2}
          isText
        />
      </div>

      {/* Slots */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Available slots</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPatient
                ? "Pick a time to request an appointment."
                : "Sign in as a patient to book."}
            </p>
          </div>
        </div>

        {grouped.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="p-6">
              <EmptyState
                icon={CalendarX}
                title="No open slots"
                description="This doctor hasn't published any open availability yet. Check back soon."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-4">
            {grouped.map(([date, daySlots]) => (
              <Card key={date} className="overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold">{formatDate(date)}</h3>
                    <span className="text-xs text-muted-foreground">
                      {daySlots.length} time{daySlots.length === 1 ? "" : "s"} available
                    </span>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {daySlots.map((s) =>
                      isPatient ? (
                        <BookSlotButton
                          key={s.id}
                          slotId={s.id}
                          label={formatRange(s.start_time, s.end_time)}
                          doctorName={name}
                          when={`${formatDate(s.date)} · ${formatRange(s.start_time, s.end_time)}`}
                        />
                      ) : (
                        <div
                          key={s.id}
                          className="flex items-center justify-center rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground"
                        >
                          <Clock className="mr-2 h-3.5 w-3.5" />
                          <span className="tabular-nums">
                            {formatRange(s.start_time, s.end_time)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  isText = false,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isText?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p
            className={`mt-1 truncate font-semibold ${
              isText ? "text-base" : "text-2xl tabular-nums"
            }`}
          >
            {value}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}
