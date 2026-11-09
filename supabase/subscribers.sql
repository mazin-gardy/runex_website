-- Runex updates list.
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- Anyone (the website, using the public anon key) can ADD an email.
-- Nobody can READ, change or delete the list with that key: there are no select, update or
-- delete policies. You see and export it in Supabase → Table Editor → subscribers.

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 200),
  first_name text check (char_length(first_name) <= 60),
  source text check (char_length(source) <= 100),          -- 'homepage' or 'join:<session id>'
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz                              -- set this when someone unsubscribes
);

alter table public.subscribers enable row level security;

drop policy if exists "Anyone can sign up for updates" on public.subscribers;
create policy "Anyone can sign up for updates"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (unsubscribed_at is null);
