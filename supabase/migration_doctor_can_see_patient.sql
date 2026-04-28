-- ============================================================================
-- Migration: let doctors read the profiles of patients who have appointments
-- with them (so the patient name shows up in the doctor's appointments view).
-- Paste into Supabase SQL editor and run. Idempotent.
-- ============================================================================

drop policy if exists "profiles read self or doctor" on public.profiles;
drop policy if exists "profiles read self or relevant" on public.profiles;

create policy "profiles read self or relevant"
  on public.profiles for select
  to authenticated
  using (
    -- own profile
    auth.uid() = id
    -- any doctor profile is publicly browsable
    or role = 'doctor'
    -- a doctor can see the patient profile when an appointment exists between them
    or exists (
      select 1
        from public.appointments a
        join public.doctors d on d.id = a.doctor_id
       where a.patient_id = profiles.id
         and d.profile_id = auth.uid()
    )
  );
