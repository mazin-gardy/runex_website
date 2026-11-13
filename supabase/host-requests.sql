-- Host approval for join requests.
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- Each session gets a secret host key. The website's private host page
-- (/host/<session id>#<host key>) uses it to list join requests and to
-- accept or decline them. The key is never readable with the public key:
-- only these functions (and you, in the dashboard) can see it.

-- 1. Secret key per session -------------------------------------------------
create table if not exists public.session_host_keys (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  host_key   text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

alter table public.session_host_keys enable row level security;   -- no policies: nobody reads it through the API
revoke all on public.session_host_keys from anon, authenticated;

-- Keys for the sessions that already exist.
insert into public.session_host_keys (session_id)
select id from public.sessions
on conflict (session_id) do nothing;

-- A key for every new session, automatically.
create or replace function public.add_session_host_key()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into session_host_keys (session_id) values (new.id) on conflict (session_id) do nothing;
  return new;
end;
$$;

drop trigger if exists sessions_add_host_key on public.sessions;
create trigger sessions_add_host_key
  after insert on public.sessions
  for each row execute function public.add_session_host_key();

-- 2. List a session's requests (host key required) ---------------------------
create or replace function public.host_get_requests(p_session_id uuid, p_host_key text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from session_host_keys k where k.session_id = p_session_id and k.host_key = p_host_key
  ) then
    raise exception 'invalid host link' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'title', s.title,
    'max_capacity', coalesce(s.max_capacity, s.maximum_capacity),
    'requests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id, 'name', m.name, 'contact', m.contact,
          'status', m.status, 'created_at', m.created_at
        ) order by m.created_at
      )
      from session_members m where m.session_id = s.id
    ), '[]'::jsonb)
  )
  into v_result
  from sessions s where s.id = p_session_id;

  return v_result;
end;
$$;

-- 3. Accept or decline one request (host key required) -----------------------
create or replace function public.host_set_request(
  p_session_id uuid, p_host_key text, p_member_id uuid, p_status text
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_capacity int;
  v_going int;
begin
  if not exists (
    select 1 from session_host_keys k where k.session_id = p_session_id and k.host_key = p_host_key
  ) then
    raise exception 'invalid host link' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'declined', 'pending') then
    raise exception 'invalid status';
  end if;

  -- Lock the session so two taps at once can't overfill it.
  select coalesce(s.max_capacity, s.maximum_capacity) into v_capacity
  from sessions s where s.id = p_session_id for update;

  if p_status = 'approved' and v_capacity is not null and v_capacity > 0 then
    select count(*) into v_going
    from session_members m
    where m.session_id = p_session_id and m.id <> p_member_id
      and lower(m.status) in ('approved', 'accepted', 'joined', 'going', 'confirmed');
    if v_going >= v_capacity then
      raise exception 'session is full';
    end if;
  end if;

  update session_members m set status = p_status
  where m.session_id = p_session_id and m.id = p_member_id;
  if not found then
    raise exception 'request not found';
  end if;

  -- Keep the session's going count in step with the approved members.
  update sessions s set current_count = (
    select count(*) from session_members m
    where m.session_id = s.id
      and lower(m.status) in ('approved', 'accepted', 'joined', 'going', 'confirmed')
  )
  where s.id = p_session_id;

  return host_get_requests(p_session_id, p_host_key);
end;
$$;

revoke all on function public.host_get_requests(uuid, text) from public;
revoke all on function public.host_set_request(uuid, text, uuid, text) from public;
grant execute on function public.host_get_requests(uuid, text) to anon, authenticated;
grant execute on function public.host_set_request(uuid, text, uuid, text) to anon, authenticated;

-- 4. Your host links ---------------------------------------------------------
-- Run this any time to get the private link for each session. Keep them secret.
select s.title,
       'https://runex-website.vercel.app/host/' || s.id || '#' || k.host_key as host_link
from public.sessions s
join public.session_host_keys k on k.session_id = s.id
order by s.created_at desc;
