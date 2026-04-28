import { CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { requireRole, getDoctorRecord } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatRange } from "@/lib/format";
import { AvailabilityForm } from "./_components/availability-form";
import { DeleteSlotButton } from "./_components/delete-slot-button";

type Slot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

export default async function AvailabilityPage() {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorRecord(profile.id);
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data: slotsData = [] } = doctor
    ? await supabase
        .from("availability")
        .select("id, date, start_time, end_time, is_booked")
        .eq("doctor_id", doctor.id)
        .gte("date", today)
        .order("date")
        .order("start_time")
    : { data: [] };

  const slots = (slotsData ?? []) as Slot[];
  const total = slots.length;
  const booked = slots.filter((s) => s.is_booked).length;
  const open = total - booked;

  // Group by date, preserving order
  const grouped: Array<[string, Slot[]]> = [];
  const byDate = new Map<string, Slot[]>();
  for (const s of slots) {
    if (!byDate.has(s.date)) {
      const arr: Slot[] = [];
      byDate.set(s.date, arr);
      grouped.push([s.date, arr]);
    }
    byDate.get(s.date)!.push(s);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <header>
        <p className="text-sm text-muted-foreground">Doctor</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a date range — we&apos;ll split it into evenly-sized slots for you.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Add slots</CardTitle>
            <CardDescription>Set a window and slot length.</CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SlotsStats total={total} booked={booked} open={open} />

          {grouped.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={CalendarClock}
                  title="No slots yet"
                  description="Use the form on the left to add your first availability window."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {grouped.map(([date, daySlots]) => {
                const dayBooked = daySlots.filter((s) => s.is_booked).length;
                const dayOpen = daySlots.length - dayBooked;
                return (
                  <Card key={date} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <CardTitle className="text-base">{formatDate(date)}</CardTitle>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Circle className="h-2 w-2 fill-current text-primary" />
                            {dayOpen} open
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            {dayBooked} booked
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-3 sm:p-4">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {daySlots.map((s) => (
                          <SlotChip key={s.id} slot={s} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotsStats({
  total,
  booked,
  open,
}: {
  total: number;
  booked: number;
  open: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile label="Total" value={total} />
      <StatTile label="Open" value={open} accent="primary" />
      <StatTile label="Booked" value={booked} accent="emerald" />
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "primary" | "emerald";
}) {
  const dotClass =
    accent === "primary"
      ? "bg-primary"
      : accent === "emerald"
      ? "bg-emerald-500"
      : "bg-muted-foreground/40";
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      </CardContent>
    </Card>
  );
}

function SlotChip({ slot }: { slot: Slot }) {
  if (slot.is_booked) {
    return (
      <div className="group relative flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex min-w-0 items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate font-medium tabular-nums text-emerald-900 dark:text-emerald-200">
            {formatRange(slot.start_time, slot.end_time)}
          </span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Booked
        </span>
      </div>
    );
  }

  return (
    <div className="group relative flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
      <div className="flex min-w-0 items-center gap-2">
        <Circle className="h-2 w-2 shrink-0 fill-current text-primary" />
        <span className="truncate font-medium tabular-nums">
          {formatRange(slot.start_time, slot.end_time)}
        </span>
      </div>
      <DeleteSlotButton id={slot.id} />
    </div>
  );
}
