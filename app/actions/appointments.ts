"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/dal";

const BookSchema = z.object({
  availability_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type BookingState =
  | { ok: false; error: string }
  | { ok: true }
  | undefined;

export async function bookAppointment(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  await requireRole("patient");

  const parsed = BookSchema.safeParse({
    availability_id: formData.get("availability_id"),
    reason: formData.get("reason") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid booking request." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_appointment", {
    p_availability_id: parsed.data.availability_id,
    p_reason: parsed.data.reason ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/doctors", "layout");
  return { ok: true };
}

export async function acceptAppointment(formData: FormData) {
  await requireRole("doctor");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.rpc("accept_appointment", { p_appointment_id: id });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/availability");
}

export async function rejectAppointment(formData: FormData) {
  await requireRole("doctor");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.rpc("reject_appointment", { p_appointment_id: id });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}
