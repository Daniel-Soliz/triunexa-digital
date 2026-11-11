-- Distribuicao de empresas por visitante, com privacidade dos contatos antes da reserva.
create table if not exists public.truinexa_public_seen (
  visitor_id uuid not null,
  lead_id uuid not null references public.truinexa_public_leads(id) on delete cascade,
  shown_day date not null,
  first_shown_at timestamptz not null default now(),
  primary key (visitor_id, lead_id)
);
create index if not exists truinexa_public_seen_day on public.truinexa_public_seen(visitor_id, shown_day);
alter table public.truinexa_public_seen enable row level security;
revoke all on public.truinexa_public_seen from anon, authenticated;

create table if not exists public.truinexa_public_claims (
  lead_id uuid primary key references public.truinexa_public_leads(id) on delete cascade,
  visitor_id uuid not null,
  claimed_day date not null,
  claimed_at timestamptz not null default now()
);
create index if not exists truinexa_public_claims_visitor_day on public.truinexa_public_claims(visitor_id, claimed_day);
alter table public.truinexa_public_claims enable row level security;
revoke all on public.truinexa_public_claims from anon, authenticated;

-- Todos os contatos comerciais passam a ser obtidos apenas apos uma reserva.
revoke select on public.truinexa_public_leads from anon, authenticated;
drop policy if exists public_catalog_read on public.truinexa_public_leads;

create or replace function public.truinexa_public_sector(p_segment text) returns text
language sql immutable security invoker set search_path = ''
as $$
 select case
 when lower(coalesce(p_segment,'')) ~ 'advog|advoc|jur[ií]d' then 'Advocacia'
 when lower(coalesce(p_segment,'')) ~ 'contab' then 'Contabilidade'
 when lower(coalesce(p_segment,'')) ~ 'barbear|barber' then 'Barbearias'
 when lower(coalesce(p_segment,'')) ~ 'cabel|sal[aã]o|beleza' then 'Cabeleireiros'
 when lower(coalesce(p_segment,'')) ~ 'odonto|dent' then 'Odontologia'
 when lower(coalesce(p_segment,'')) ~ 'est[eé]t|derm' then 'Estética'
 when lower(coalesce(p_segment,'')) ~ 'academ|fitness|pilates' then 'Academias'
 when lower(coalesce(p_segment,'')) ~ 'pet|veterin' then 'Pet shops'
 when lower(coalesce(p_segment,'')) ~ 'restaur|pizza|aliment|lanch' then 'Restaurantes'
 when lower(coalesce(p_segment,'')) ~ 'oficina|mec[aâ]nic|auto' then 'Oficinas'
 else 'Outros serviços' end
$$;

-- A resposta publica nao traz telefone, redes, endereco completo, e-mail ou responsavel.
create or replace function public.truinexa_public_feed(p_visitor uuid, p_session uuid)
returns table(id uuid, company text, segment text, city text, state text,
              neighborhood text, company_summary text, source_verified_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_day date := (now() at time zone 'America/Sao_Paulo')::date;
begin
 if p_visitor is null or p_session is null or not exists (
    select 1 from public.truinexa_public_visits v
    where v.visitor_id=p_visitor and v.session_id=p_session
      and v.last_seen_at > now() - interval '15 minutes'
 ) then raise exception 'Sessao publica invalida' using errcode='42501'; end if;

 return query
 with candidates as (
   select l.id, l.company, l.segment, l.city, l.state, l.neighborhood,
          l.company_summary, l.source_verified_at,
          case when s.shown_day=v_day then 0 else 1 end as priority
   from public.truinexa_public_leads l
   left join public.truinexa_public_seen s on s.visitor_id=p_visitor and s.lead_id=l.id
   left join public.truinexa_public_claims c on c.lead_id=l.id
   where (s.lead_id is null or s.shown_day=v_day)
     and (c.lead_id is null or (c.visitor_id=p_visitor and c.claimed_day=v_day))
 ), ranked as (
   select x.*, row_number() over(
     partition by public.truinexa_public_sector(x.segment)
     order by x.priority, md5(x.id::text || p_visitor::text || v_day::text)
   ) as rn from candidates x
 ), picked as (
   select x.* from ranked x where x.rn<=50
 ), recorded as (
   insert into public.truinexa_public_seen(visitor_id,lead_id,shown_day)
   select p_visitor,p.id,v_day from picked p
   on conflict(visitor_id,lead_id) do nothing
   returning lead_id
 )
 select p.id,p.company,p.segment,p.city,p.state,p.neighborhood,
        p.company_summary,p.source_verified_at
 from picked p order by public.truinexa_public_sector(p.segment),p.priority,p.company;
end
$$;
revoke all on function public.truinexa_public_feed(uuid,uuid) from public, anon, authenticated;
grant execute on function public.truinexa_public_feed(uuid,uuid) to anon, authenticated;

-- Conflitos simultaneos sao resolvidos pelo indice unico em lead_id.
-- A reserva impede que outro visitante acesse esse contato; a ficha
-- permanece visivel ao reservante ate a proxima virada de dia em Sao Paulo.
create or replace function public.truinexa_public_claim(p_visitor uuid, p_session uuid, p_lead uuid)
returns setof public.truinexa_public_leads
language plpgsql security definer set search_path = ''
as $$
declare v_day date := (now() at time zone 'America/Sao_Paulo')::date;
begin
 if p_visitor is null or p_session is null or p_lead is null or not exists (
    select 1 from public.truinexa_public_visits v
    where v.visitor_id=p_visitor and v.session_id=p_session
      and v.last_seen_at > now()-interval '15 minutes'
 ) then raise exception 'Sessao publica invalida' using errcode='42501'; end if;
 if not exists (select 1 from public.truinexa_public_seen s
                where s.visitor_id=p_visitor and s.lead_id=p_lead and s.shown_day=v_day) then
   return; 
 end if;
 insert into public.truinexa_public_claims(lead_id,visitor_id,claimed_day)
 values(p_lead,p_visitor,v_day) on conflict(lead_id) do nothing;
 return query select l.* from public.truinexa_public_leads l
   join public.truinexa_public_claims c on c.lead_id=l.id
   where l.id=p_lead and c.visitor_id=p_visitor and c.claimed_day=v_day;
end
$$;
revoke all on function public.truinexa_public_claim(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.truinexa_public_claim(uuid,uuid,uuid) to anon,authenticated;
