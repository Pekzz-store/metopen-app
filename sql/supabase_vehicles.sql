-- Create vehicles table for per-user vehicle CRUD

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  license_plate text not null,
  vehicle_type text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.vehicles enable row level security;

-- Allow authenticated users to insert their own vehicles
DROP POLICY IF EXISTS "allow insert for owner" ON public.vehicles;
create policy "allow insert for owner" on public.vehicles
  for insert
  with check (auth.uid() = user_id);

-- Allow authenticated users to select their own vehicles
DROP POLICY IF EXISTS "allow select for owner" ON public.vehicles;
create policy "allow select for owner" on public.vehicles
  for select
  using (auth.uid() = user_id);

-- Allow authenticated users to update their own vehicles
DROP POLICY IF EXISTS "allow update for owner" ON public.vehicles;
create policy "allow update for owner" on public.vehicles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow authenticated users to delete their own vehicles
DROP POLICY IF EXISTS "allow delete for owner" ON public.vehicles;
create policy "allow delete for owner" on public.vehicles
  for delete
  using (auth.uid() = user_id);

-- Grant execute/select as needed (authenticated can use table ops due to policies)

-- Note: Run this file in Supabase SQL Editor. Do NOT seed fake rows here.
