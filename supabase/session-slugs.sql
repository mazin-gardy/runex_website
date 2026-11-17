-- Readable session links: runex-website.vercel.app/r/wheels-run-club
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- Adds a "slug" (the readable part of the link) to every session, made from its title.
-- If two sessions have the same title, the later one gets a few characters of its id
-- added, e.g. lets-run and lets-run-2ee9. New sessions get one automatically.
-- To change a session's link, edit its slug in Table Editor → sessions
-- (lowercase letters, numbers and dashes only).

-- 1. The column -----------------------------------------------------------------
alter table public.sessions add column if not exists slug text;

do $$ begin
  alter table public.sessions add constraint sessions_slug_format
    check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60);
exception when duplicate_object then null; end $$;

create unique index if not exists sessions_slug_key on public.sessions (slug);

-- 2. Make a slug from a title ---------------------------------------------------
create or replace function public.make_session_slug(p_title text, p_id uuid)
returns text
language plpgsql stable set search_path = public as $$
declare
  v_base text;
  v_slug text;
begin
  -- Drop apostrophes first so "Let's run" becomes lets-run, not let-s-run.
  v_base := regexp_replace(lower(coalesce(p_title, '')), '[''’`]', '', 'g');
  v_base := left(trim(both '-' from regexp_replace(v_base, '[^a-z0-9]+', '-', 'g')), 50);
  v_base := trim(both '-' from v_base);
  if char_length(v_base) < 2 then v_base := 'run'; end if;

  v_slug := v_base;
  if exists (select 1 from sessions s where s.slug = v_slug and s.id <> p_id) then
    v_slug := v_base || '-' || left(replace(p_id::text, '-', ''), 4);
  end if;
  if exists (select 1 from sessions s where s.slug = v_slug and s.id <> p_id) then
    v_slug := v_base || '-' || left(replace(p_id::text, '-', ''), 8);
  end if;
  return v_slug;
end;
$$;

-- 3. Slugs for existing sessions, oldest first (so the first "Let's run" gets the plain name)
do $$
declare r record;
begin
  for r in select id, title from public.sessions where slug is null order by created_at loop
    update public.sessions set slug = public.make_session_slug(r.title, r.id) where id = r.id;
  end loop;
end $$;

-- 4. A slug for every new session, automatically ---------------------------------
create or replace function public.set_session_slug()
returns trigger
language plpgsql set search_path = public as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := make_session_slug(new.title, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_set_slug on public.sessions;
create trigger sessions_set_slug
  before insert on public.sessions
  for each row execute function public.set_session_slug();

-- 5. Your links -------------------------------------------------------------------
select title, 'https://runex-website.vercel.app/r/' || slug as link
from public.sessions
order by created_at desc;
