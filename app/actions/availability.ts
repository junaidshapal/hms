"use server";

import { revalidatePath } from "next/cache";
import { eachDayOfInterval, parseISO } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getDoctorRecord } from "@/lib/auth/dal";

const MAX_RANGE_DAYS = 31;

const SlotsSchema = z
  .object({
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
    duration_minutes: z.coerce.number().int().min(15).max(240),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  })
  .refine((v) => v.from_date <= v.to_date, {
    message: "End date must be on or after start date",
    path: ["to_date"],
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

  const parsed = SlotsSchema.safeParse({
    from_date: formData.get("from_date"),
    to_date: formData.get("to_date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    duration_minutes: formData.get("duration_minutes"),
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const first = Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0];
    return { ok: false, error: first ?? "Invalid input." };
  }

  const { from_date, to_date, start_time, end_time, duration_minutes } = parsed.data;
  const startMin = toMinutes(start_time);
  const endMin = toMinutes(end_time);

  // Reject past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = parseISO(from_date);
  if (fromDate < today) {
    return { ok: false, error: "Cannot create slots in the past." };
  }

  const days = eachDayOfInterval({ start: fromDate, end: parseISO(to_date) });
  if (days.length > MAX_RANGE_DAYS) {
    return {
      ok: false,
      error: `Range is too long — please pick at most ${MAX_RANGE_DAYS} days at a time.`,
    };
  }

  const slotsPerDay: Array<{ start_time: string; end_time: string }> = [];
  for (let t = startMin; t + duration_minutes <= endMin; t += duration_minutes) {
    slotsPerDay.push({
      start_time: toTime(t) + ":00",
      end_time: toTime(t + duration_minutes) + ":00",
    });
  }

  if (slotsPerDay.length === 0) {
    return { ok: false, error: "Time window is too short for the chosen duration." };
  }

  const rows = days.flatMap((d) => {
    const date = d.toISOString().slice(0, 10);
    return slotsPerDay.map((s) => ({
      doctor_id: doctor.id,
      date,
      start_time: s.start_time,
      end_time: s.end_time,
    }));
  });

  const supabase = await createClient();
  // Skip duplicates so re-submitting an overlapping range adds the new days
  // without erroring on the ones that already exist.
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
      error: "No new slots — those times already exist on the chosen dates.",
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
