import { requireRole, getDoctorRecord } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityForm } from "./_components/availability-form";
import { SlotsBoard, type SlotsBoardSlot } from "./_components/slots-board";

export default async function AvailabilityPage() {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorRecord(profile.id);
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data: slotsData = [] } = doctor
    ? await supabase
        .from("availability")
        .select("id, date, start_time, end_time, is_booked, slot_type")
        .eq("doctor_id", doctor.id)
        .gte("date", today)
        .order("date")
        .order("start_time")
    : { data: [] };

  const slots = (slotsData ?? []) as SlotsBoardSlot[];
  const regulars = slots.filter((s) => s.slot_type === "regular");
  const total = regulars.length;
  const booked = regulars.filter((s) => s.is_booked).length;
  const open = total - booked;

  // Group by date, preserving order
  const grouped: Array<[string, SlotsBoardSlot[]]> = [];
  const byDate = new Map<string, SlotsBoardSlot[]>();
  for (const s of slots) {
    if (!byDate.has(s.date)) {
      const arr: SlotsBoardSlot[] = [];
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
          Pick a day and a time window — we&apos;ll split it into evenly-sized slots for you.
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
          <SlotsBoard days={grouped} />
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
