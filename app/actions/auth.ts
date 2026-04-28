"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignUpSchema = SignInSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(["doctor", "patient"]),
  specialization: z.string().max(80).optional(),
});

export type AuthState =
  | { ok: false; error: string; fields?: Record<string, string[]> }
  | { ok: true }
  | undefined;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check your credentials.",
      fields: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    specialization: formData.get("specialization") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the errors below.",
      fields: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password, role, specialization } = parsed.data;

  if (role === "doctor" && (!specialization || specialization.trim().length < 2)) {
    return {
      ok: false,
      error: "Doctors must provide a specialization.",
      fields: { specialization: ["Specialization is required for doctors."] },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // If the doctor signed up, create their doctors row using the admin client
  // so we don't depend on the user's session being established yet.
  if (role === "doctor" && data.user) {
    const admin = createAdminClient();
    const { error: docErr } = await admin.from("doctors").insert({
      profile_id: data.user.id,
      specialization: specialization!.trim(),
    });
    if (docErr) {
      return { ok: false, error: `Doctor profile creation failed: ${docErr.message}` };
    }
  }

  // If email confirmation is OFF, the user is signed in. Otherwise we'd need
  // to ask them to confirm their email. We assume confirmation is off for the MVP.
  if (!data.session) {
    return {
      ok: false,
      error: "Account created. Please check your email to confirm before signing in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
