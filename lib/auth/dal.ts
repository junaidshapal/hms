import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/supabase/types";

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(role: Role) {
  const profile = await requireProfile();
  if (profile.role !== role) redirect("/dashboard");
  return profile;
}

export const getDoctorRecord = cache(async (profileId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("doctors")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data;
});
