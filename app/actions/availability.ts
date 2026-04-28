"use server";

import { revalidatePath } from "next/cache";
import { parseISO } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getDoctorRecord } from "@/lib/auth/dal";

const BreakSchema = z
  .object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((b) => b.start < b.end, {
    message: "Break end must be after start",
    path: ["end"],
  });

const SlotsSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
    duration_minutes: z.coerce.number().int().min(15).max(240),
    breaks: z.array(BreakSchema).max(5).default([]),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export type AvailabilityState =
  | { ok: false; error: string }
  | { ok: true; created: number }
  | undefined;

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function createAvailabilitySlots(
  _prev: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorRecord(profile.id);
  if (!doctor) {
    return { ok: false, error: "Doctor profile not found." };
  }

  let breaksRaw: unknown = [];
  try {
    breaksRaw = JSON.parse(String(formData.get("breaks") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid breaks payload." };
  }

  const parsed = SlotsSchema.safeParse({
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    duration_minutes: formData.get("duration_minutes"),
    breaks: breaksRaw,
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const first = Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0];
    return { ok: false, error: first ?? "Invalid input." };
  }

  const { date, start_time, end_time, duration_minutes, breaks } = parsed.data;
  const startMin = toMinutes(start_time);
  const endMin = toMinutes(end_time);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parseISO(date) < today) {
    return { ok: false, error: "Cannot create slots in the past." };
  }

  const supabase = await createClient();

  // Pull existing breaks for this date so we don't accidentally insert regular
  // slots inside an already-published break window.
  const { data: existingBreaks } = await supabase
    .from("availability")
    .select("start_time, end_time")
    .eq("doctor_id", doctor.id)
    .eq("date", date)
    .eq("slot_type", "break");

  const allBreakRanges = [
    ...breaks.map((b) => ({ start: toMinutes(b.start), end: toMinutes(b.end) })),
    ...((existingBreaks ?? []).map((b) => ({
      start: toMinutes(b.start_time),
      end: toMinutes(b.end_time),
    }))),
  ];
  const overlapsBreak = (slotStart: number, slotEnd: number) =>
    allBreakRanges.some((b) => slotStart < b.end && slotEnd > b.start);

  type Row = {
    doctor_id: string;
    date: string;
    start_time: string;
    end_time: string;
    slot_type: "regular" | "break";
  };

  const rows: Row[] = [];
  let regularCount = 0;
  for (let t = startMin; t + duration_minutes <= endMin; t += duration_minutes) {
    const slotEnd = t + duration_minutes;
    if (overlapsBreak(t, slotEnd)) continue;
    rows.push({
      doctor_id: doctor.id,
      date,
      start_time: toTime(t) + ":00",
      end_time: toTime(slotEnd) + ":00",
      slot_type: "regular",
    });
    regularCount += 1;
  }

  // One row per *new* break window. Existing breaks are already in the table.
  for (const b of breaks) {
    rows.push({
      doctor_id: doctor.id,
      date,
      start_time: b.start + ":00",
      end_time: b.end + ":00",
      slot_type: "break",
    });
  }

  if (regularCount === 0) {
    return {
      ok: false,
      error:
        allBreakRanges.length > 0
          ? "Every slot in that window is covered by a break."
          : "Time window is too short for the chosen duration.",
    };
  }

  // Skip duplicates so re-submitting the same window only adds the new slots.
  const { data, error } = await supabase
    .from("availability")
    .upsert(rows, {
      onConflict: "doctor_id,date,start_time",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  const created = data?.length ?? 0;
  if (created === 0) {
    return {
      ok: false,
      error: "No new slots — those times already exist on this date.",
    };
  }

  revalidatePath("/availability");
  revalidatePath(`/doctors/${doctor.id}`);
  return { ok: true, created };
}

export async function deleteAvailabilitySlot(formData: FormData) {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorRecord(profile.id);
  if (!doctor) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("availability")
    .delete()
    .eq("id", id)
    .eq("doctor_id", doctor.id)
    .eq("is_booked", false);

  revalidatePath("/availability");
  revalidatePath(`/doctors/${doctor.id}`);
}

export type BulkDeleteState =
  | { ok: false; error: string }
  | { ok: true; deleted: number }
  | undefined;

export async function deleteAvailabilitySlots(ids: string[]): Promise<BulkDeleteState> {
  const profile = await requireRole("doctor");
  const doctor = await getDoctorRecord(profile.id);
  if (!doctor) return { ok: false, error: "Doctor profile not found." };

  const cleanIds = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
  if (cleanIds.length === 0) {
    return { ok: false, error: "Nothing selected." };
  }

  const supabase = await createClient();
  // Server-side guards: only this doctor's slots, only unbooked.
  const { data, error } = await supabase
    .from("availability")
    .delete()
    .in("id", cleanIds)
    .eq("doctor_id", doctor.id)
    .eq("is_booked", false)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/availability");
  revalidatePath(`/doctors/${doctor.id}`);
  return { ok: true, deleted: data?.length ?? 0 };
}
