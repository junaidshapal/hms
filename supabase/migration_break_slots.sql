-- ============================================================================
-- Migration: add break slots
-- Adds a slot_type column to availability so break windows can be stored
-- alongside bookable slots. Updates book_appointment to reject break slots.
-- Paste into Supabase SQL editor and run. Idempotent.
-- ============================================================================

alter table public.availability
  add column if not exists slot_type text not null default 'regular'
  check (slot_type in ('regular', 'break'));

create index if not exists availability_slot_type_idx
  on public.availability (slot_type);

-- Booking RPC: reject if the chosen slot is a break window
create or replace function public.book_appointment(
  p_availability_id uuid,
  p_reason          text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid           uuid := auth.uid();
  v_role          text;
  v_doctor_id     uuid;
  v_is_booked     boolean;
  v_slot_type     text;
  v_existing      uuid;
  v_appointment   uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is distinct from 'patient' then
    raise exception 'Only patients can book appointments';
  end if;

  select doctor_id, is_booked, slot_type
    into v_doctor_id, v_is_booked, v_slot_type
    from public.availability
   where id = p_availability_id
   for update;

  if v_doctor_id is null then
    raise exception 'Slot not found';
  end if;

  if v_slot_type = 'break' then
    raise exception 'Break windows cannot be booked';
  end if;

  if v_is_booked then
    raise exception 'Slot already booked';
  end if;

  select id into v_existing
    from public.appointments
   where availability_id = p_availability_id
     and status = 'pending';
  if v_existing is not null then
    raise exception 'Slot already has a pending request';
  end if;

  insert into public.appointments (patient_id, doctor_id, availability_id, status, reason)
  values (v_uid, v_doctor_id, p_availability_id, 'pending', nullif(trim(p_reason), ''))
  returning id into v_appointment;

  return v_appointment;
end;
$$;
