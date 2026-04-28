-- ============================================================================
-- HMS schema  —  paste this into Supabase SQL editor and run.
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null check (role in ('doctor', 'patient')),
  created_at  timestamptz not null default now()
);

create unique index if not exists profiles_email_unique
  on public.profiles (lower(email));

create table if not exists public.doctors (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null unique references public.profiles(id) on delete cascade,
  specialization    text not null,
  bio               text,
  years_experience  int,
  created_at        timestamptz not null default now()
);

create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references public.doctors(id) on delete cascade,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  is_booked   boolean not null default false,
  slot_type   text not null default 'regular' check (slot_type in ('regular', 'break')),
  created_at  timestamptz not null default now(),
  constraint  availability_time_order check (start_time < end_time),
  constraint  availability_unique_slot unique (doctor_id, date, start_time)
);

create index if not exists availability_doctor_date_idx
  on public.availability (doctor_id, date);
create index if not exists availability_slot_type_idx
  on public.availability (slot_type);

create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.profiles(id) on delete cascade,
  doctor_id       uuid not null references public.doctors(id) on delete cascade,
  availability_id uuid not null unique references public.availability(id) on delete cascade,
  status          text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected')),
  reason          text,
  created_at      timestamptz not null default now()
);

create index if not exists appointments_patient_idx on public.appointments (patient_id);
create index if not exists appointments_doctor_idx  on public.appointments (doctor_id);

-- ----------------------------------------------------------------------------
-- Auto-create profile on signup. Reads name + role from raw_user_meta_data.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Booking RPC  —  atomic check-and-insert to prevent double-booking races.
-- Caller's profile (auth.uid()) must be a patient.
-- ----------------------------------------------------------------------------
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

  -- Block double-pending requests on the same slot
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

-- ----------------------------------------------------------------------------
-- Accept / reject RPCs  —  ensure caller owns the doctor record.
-- ----------------------------------------------------------------------------
create or replace function public.accept_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid           uuid := auth.uid();
  v_doctor_id     uuid;
  v_avail_id      uuid;
  v_status        text;
begin
  select a.doctor_id, a.availability_id, a.status
    into v_doctor_id, v_avail_id, v_status
    from public.appointments a
   where a.id = p_appointment_id
   for update;

  if v_doctor_id is null then
    raise exception 'Appointment not found';
  end if;

  if not exists (
    select 1 from public.doctors d
     where d.id = v_doctor_id and d.profile_id = v_uid
  ) then
    raise exception 'Not your appointment';
  end if;

  if v_status <> 'pending' then
    raise exception 'Only pending appointments can be accepted';
  end if;

  update public.appointments
     set status = 'accepted'
   where id = p_appointment_id;

  update public.availability
     set is_booked = true
   where id = v_avail_id;
end;
$$;

create or replace function public.reject_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_doctor_id uuid;
  v_status    text;
begin
  select a.doctor_id, a.status
    into v_doctor_id, v_status
    from public.appointments a
   where a.id = p_appointment_id
   for update;

  if v_doctor_id is null then
    raise exception 'Appointment not found';
  end if;

  if not exists (
    select 1 from public.doctors d
     where d.id = v_doctor_id and d.profile_id = v_uid
  ) then
    raise exception 'Not your appointment';
  end if;

  if v_status <> 'pending' then
    raise exception 'Only pending appointments can be rejected';
  end if;

  update public.appointments
     set status = 'rejected'
   where id = p_appointment_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.doctors      enable row level security;
alter table public.availability enable row level security;
alter table public.appointments enable row level security;

-- profiles: any authenticated user can read profiles of doctors (for browsing)
-- and their own row. Doctors can additionally read profiles of patients who
-- booked an appointment with them (so the doctor's UI can show patient names).
drop policy if exists "profiles read self or doctor" on public.profiles;
drop policy if exists "profiles read self or relevant" on public.profiles;
create policy "profiles read self or relevant"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or role = 'doctor'
    or exists (
      select 1
        from public.appointments a
        join public.doctors d on d.id = a.doctor_id
       where a.patient_id = profiles.id
         and d.profile_id = auth.uid()
    )
  );

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- doctors: any authenticated user can read; only the owning profile can write.
drop policy if exists "doctors read all" on public.doctors;
create policy "doctors read all"
  on public.doctors for select
  to authenticated
  using (true);

drop policy if exists "doctors insert own" on public.doctors;
create policy "doctors insert own"
  on public.doctors for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "doctors update own" on public.doctors;
create policy "doctors update own"
  on public.doctors for update
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "doctors delete own" on public.doctors;
create policy "doctors delete own"
  on public.doctors for delete
  to authenticated
  using (profile_id = auth.uid());

-- availability: any authenticated user can read; only owning doctor can write.
drop policy if exists "availability read all" on public.availability;
create policy "availability read all"
  on public.availability for select
  to authenticated
  using (true);

drop policy if exists "availability insert own" on public.availability;
create policy "availability insert own"
  on public.availability for insert
  to authenticated
  with check (
    exists (
      select 1 from public.doctors d
       where d.id = doctor_id and d.profile_id = auth.uid()
    )
  );

drop policy if exists "availability update own" on public.availability;
create policy "availability update own"
  on public.availability for update
  to authenticated
  using (
    exists (
      select 1 from public.doctors d
       where d.id = doctor_id and d.profile_id = auth.uid()
    )
  );

drop policy if exists "availability delete own" on public.availability;
create policy "availability delete own"
  on public.availability for delete
  to authenticated
  using (
    exists (
      select 1 from public.doctors d
       where d.id = doctor_id and d.profile_id = auth.uid()
    )
  );

-- appointments: patient sees own; doctor sees own.
-- Inserts are done via the book_appointment RPC (security definer); direct
-- inserts are blocked. Status updates go via accept/reject RPCs.
drop policy if exists "appointments read participants" on public.appointments;
create policy "appointments read participants"
  on public.appointments for select
  to authenticated
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.doctors d
       where d.id = doctor_id and d.profile_id = auth.uid()
    )
  );
