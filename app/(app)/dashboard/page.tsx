import Link from "next/link";
import { CalendarClock, Stethoscope, UsersRound, ClipboardList } from "lucide-react";
import { requireProfile, getDoctorRecord } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatRange } from "@/lib/format";

type AppointmentRow = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  reason: string | null;
  doctor: { id: string; specialization: string; profile: { name: string } | null } | null;
  patient: { name: string } | null;
  slot: { date: string; start_time: string; end_time: string } | null;
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isDoctor = profile.role === "doctor";

  const today = new Date().toISOString().slice(0, 10);

  if (isDoctor) {
    const doctor = await getDoctorRecord(profile.id);

    const [{ data: pending = [] }, { data: upcoming = [] }, { data: todaySlots = [] }] =
      await Promise.all([
        supabase
          .from("appointments")
          .select(
            "id, status, reason, patient:profiles!appointments_patient_id_fkey(name), slot:availability(date, start_time, end_time)",
          )
          .eq("doctor_id", doctor?.id ?? "00000000-0000-0000-0000-000000000000")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("appointments")
          .select(
            "id, status, reason, patient:profiles!appointments_patient_id_fkey(name), slot:availability(date, start_time, end_time)",
          )
          .eq("doctor_id", doctor?.id ?? "00000000-0000-0000-0000-000000000000")
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("availability")
          .select("id, date, start_time, end_time, is_booked")
          .eq("doctor_id", doctor?.id ?? "00000000-0000-0000-0000-000000000000")
          .eq("date", today)
          .order("start_time"),
      ]);

    const pendingRows = (pending as unknown as AppointmentRow[]) ?? [];
    const upcomingRows = (upcoming as unknown as AppointmentRow[]) ?? [];

    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Doctor dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Welcome, Dr. {profile.name.split(" ").slice(-1)[0]}
            </h1>
          </div>
          <Link href="/availability">
            <Button>Manage availability</Button>
          </Link>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending requests"
            value={pendingRows.length}
            icon={ClipboardList}
            href="/appointments"
          />
          <StatCard
            label="Today's slots"
            value={todaySlots?.length ?? 0}
            icon={CalendarClock}
            href="/availability"
          />
          <StatCard
            label="Upcoming accepted"
            value={upcomingRows.length}
            icon={UsersRound}
            href="/appointments"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending requests</CardTitle>
              <CardDescription>Patients waiting on your response.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRows.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="All caught up"
                  description="No pending requests right now."
                />
              ) : (
                <ul className="divide-y">
                  {pendingRows.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.patient?.name ?? "Patient"}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.slot ? `${formatDate(a.slot.date)} · ${formatRange(a.slot.start_time, a.slot.end_time)}` : "—"}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
              <Separator className="my-4" />
              <Link href="/appointments" className="text-sm font-medium hover:underline">
                View all appointments →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s schedule</CardTitle>
              <CardDescription>Slots set for {formatDate(today)}.</CardDescription>
            </CardHeader>
            <CardContent>
              {(todaySlots?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No slots today"
                  description="Open availability to add some."
                  action={
                    <Link href="/availability">
                      <Button size="sm">Add availability</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="grid gap-2">
                  {todaySlots!.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                    >
                      <span>{formatRange(s.start_time, s.end_time)}</span>
                      {s.is_booked ? (
                        <StatusBadge status="accepted" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Open</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -- Patient dashboard --
  const [{ data: pending = [] }, { data: upcoming = [] }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, status, reason, doctor:doctors(id, specialization, profile:profiles(name)), slot:availability(date, start_time, end_time)",
      )
      .eq("patient_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select(
        "id, status, reason, doctor:doctors(id, specialization, profile:profiles(name)), slot:availability(date, start_time, end_time)",
      )
      .eq("patient_id", profile.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const pendingRows = (pending as unknown as AppointmentRow[]) ?? [];
  const upcomingRows = (upcoming as unknown as AppointmentRow[]) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Patient dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Hello, {profile.name.split(" ")[0]}
          </h1>
        </div>
        <Link href="/doctors">
          <Button>Find a doctor</Button>
        </Link>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pendingRows.length} icon={ClipboardList} href="/appointments" />
        <StatCard label="Upcoming" value={upcomingRows.length} icon={CalendarClock} href="/appointments" />
        <StatCard label="Browse" value="Doctors" icon={Stethoscope} href="/doctors" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>Waiting for confirmation.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRows.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No pending requests"
                description="Book a slot from the doctors list to get started."
                action={
                  <Link href="/doctors">
                    <Button size="sm">Find a doctor</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y">
                {pendingRows.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        Dr. {a.doctor?.profile?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.slot
                          ? `${formatDate(a.slot.date)} · ${formatRange(a.slot.start_time, a.slot.end_time)}`
                          : "—"}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Confirmed appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingRows.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing on your calendar yet"
                description="Once a doctor accepts, it'll show up here."
              />
            ) : (
              <ul className="divide-y">
                {upcomingRows.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        Dr. {a.doctor?.profile?.name ?? "—"}{" "}
                        <span className="text-xs text-muted-foreground">· {a.doctor?.specialization}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.slot
                          ? `${formatDate(a.slot.date)} · ${formatRange(a.slot.start_time, a.slot.end_time)}`
                          : "—"}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  icon: typeof CalendarClock;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-colors group-hover:border-foreground/30">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
