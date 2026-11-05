-- A deliberately narrow public projection; CRM tables and their policies stay private.
create table public.truinexa_platform_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.truinexa_platform_owners enable row level security;
revoke all on public.truinexa_platform_owners from anon, authenticated;
grant select on public.truinexa_platform_owners to authenticated;
create policy owner_self on public.truinexa_platform_owners for select to authenticated
using (user_id = (select auth.uid()));
insert into public.truinexa_platform_owners(user_id)
select id from public.truinexa_profiles where email = 'danielsoliz1973@gmail.com' and role = 'admin' and status = 'active';

create table public.truinexa_public_leads (
 id uuid primary key references public.truinexa_leads(id) on delete cascade,
 company text not null, segment text, city text, state text, neighborhood text,
 phone text, whatsapp text, website text, instagram_url text,
 source_url text not null, source_verified_at timestamptz not null,
 company_summary text
);
alter table public.truinexa_public_leads enable row level security;
revoke all on public.truinexa_public_leads from anon, authenticated;
grant select on public.truinexa_public_leads to anon, authenticated;
create policy public_catalog_read on public.truinexa_public_leads for select to anon, authenticated using (true);

create function truinexa_private.sync_public_lead() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.source_url ~ '^https?://' and new.source_verified_at is not null then
  insert into public.truinexa_public_leads
  (id,company,segment,city,state,neighborhood,phone,whatsapp,website,instagram_url,source_url,source_verified_at,company_summary)
  values(new.id,new.company,new.segment,new.city,new.state,new.neighborhood,new.phone,new.whatsapp,new.website,coalesce(new.instagram_url,new.instagram),new.source_url,new.source_verified_at,new.company_summary)
  on conflict(id) do update set company=excluded.company,segment=excluded.segment,city=excluded.city,state=excluded.state,neighborhood=excluded.neighborhood,phone=excluded.phone,whatsapp=excluded.whatsapp,website=excluded.website,instagram_url=excluded.instagram_url,source_url=excluded.source_url,source_verified_at=excluded.source_verified_at,company_summary=excluded.company_summary;
 else
  delete from public.truinexa_public_leads where id=new.id;
 end if;
 return new;
end $$;
revoke all on function truinexa_private.sync_public_lead() from public,anon,authenticated;
create trigger truinexa_sync_public_lead after insert or update on public.truinexa_leads
for each row execute function truinexa_private.sync_public_lead();
insert into public.truinexa_public_leads
select id,company,segment,city,state,neighborhood,phone,whatsapp,website,coalesce(instagram_url,instagram),source_url,source_verified_at,company_summary
from public.truinexa_leads where source_url ~ '^https?://' and source_verified_at is not null;

create table public.truinexa_public_visits (
 session_id uuid primary key, visitor_id uuid not null,
 started_at timestamptz not null default now(), last_seen_at timestamptz not null default now()
);
create index truinexa_public_visits_seen on public.truinexa_public_visits(last_seen_at);
create index truinexa_public_visits_visitor on public.truinexa_public_visits(visitor_id);
alter table public.truinexa_public_visits enable row level security;
revoke all on public.truinexa_public_visits from anon,authenticated;
grant select on public.truinexa_public_visits to authenticated;
create policy owner_visits_read on public.truinexa_public_visits for select to authenticated
using (exists(select 1 from public.truinexa_platform_owners where user_id=(select auth.uid())));

create table public.truinexa_public_feedback (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null unique references public.truinexa_public_visits(session_id),
 message text not null check(char_length(message) between 10 and 2000),
 rating integer not null check(rating between 1 and 5),
 created_at timestamptz not null default now()
);
alter table public.truinexa_public_feedback enable row level security;
revoke all on public.truinexa_public_feedback from anon,authenticated;
grant select on public.truinexa_public_feedback to authenticated;
create policy owner_feedback_read on public.truinexa_public_feedback for select to authenticated
using (exists(select 1 from public.truinexa_platform_owners where user_id=(select auth.uid())));

-- Write-only RPC: intentionally privileged to avoid granting table writes/reads
-- to visitors. No dynamic SQL, no caller-supplied timestamps, typed UUIDs.
create function public.truinexa_public_heartbeat(p_session uuid,p_visitor uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_session is null or p_visitor is null then raise exception 'Identificador inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_visitor::text, 0));
 if not exists(select 1 from public.truinexa_public_visits where session_id=p_session)
 and (select count(*) from public.truinexa_public_visits where visitor_id=p_visitor and started_at>now()-interval '1 hour') >= 20 then
  raise exception 'Limite de sessões atingido';
 end if;
 insert into public.truinexa_public_visits(session_id,visitor_id) values(p_session,p_visitor)
 on conflict(session_id) do update set last_seen_at=now()
 where truinexa_public_visits.visitor_id=excluded.visitor_id and truinexa_public_visits.last_seen_at<now()-interval '15 seconds';
end $$;
revoke all on function public.truinexa_public_heartbeat(uuid,uuid) from public,anon,authenticated;
grant execute on function public.truinexa_public_heartbeat(uuid,uuid) to anon,authenticated;

create function public.truinexa_submit_feedback(p_session uuid,p_message text,p_rating integer) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_message is null or char_length(trim(p_message)) not between 10 and 2000 or p_rating is null or p_rating not between 1 and 5 then raise exception 'Confira sua mensagem e avaliação'; end if;
 if not exists(select 1 from public.truinexa_public_visits where session_id=p_session and last_seen_at>now()-interval '1 hour') then raise exception 'Sessão expirada, atualize a página'; end if;
 insert into public.truinexa_public_feedback(session_id,message,rating) values(p_session,trim(p_message),p_rating);
end $$;
revoke all on function public.truinexa_submit_feedback(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.truinexa_submit_feedback(uuid,text,integer) to anon,authenticated;

create function public.truinexa_public_metrics() returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.truinexa_platform_owners where user_id=(select auth.uid())) then raise exception 'Acesso exclusivo do titular' using errcode='42501'; end if;
 return (select jsonb_build_object(
 'total',count(*),'unique',count(distinct visitor_id),
 'online',count(distinct visitor_id) filter(where last_seen_at>now()-interval '2 minutes'),
 'today',count(*) filter(where started_at >= (date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo')),
 'since',min(started_at)) from public.truinexa_public_visits);
end $$;
revoke all on function public.truinexa_public_metrics() from public,anon,authenticated;
grant execute on function public.truinexa_public_metrics() to authenticated;
