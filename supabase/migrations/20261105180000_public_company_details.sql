
alter table public.truinexa_public_leads
 add column email text,
 add column address text,
 add column contact_name text,
 add column contact_role text,
 add column details_sources jsonb not null default '[]'::jsonb;

-- Extra contact fields are curated separately: never copy private CRM names/emails automatically.
create or replace function truinexa_private.sync_public_lead() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.source_url ~ '^https?://' and new.source_verified_at is not null then
  insert into public.truinexa_public_leads
  (id,company,segment,city,state,neighborhood,phone,whatsapp,website,instagram_url,source_url,source_verified_at,company_summary,address)
  values(new.id,new.company,new.segment,new.city,new.state,new.neighborhood,new.phone,new.whatsapp,new.website,
   coalesce(nullif(new.instagram_url,''),new.instagram),new.source_url,new.source_verified_at,new.company_summary,new.address)
  on conflict(id) do update set company=excluded.company,segment=excluded.segment,city=excluded.city,
  state=excluded.state,neighborhood=excluded.neighborhood,phone=excluded.phone,whatsapp=excluded.whatsapp,
  website=excluded.website,instagram_url=excluded.instagram_url,source_url=excluded.source_url,
  source_verified_at=excluded.source_verified_at,company_summary=excluded.company_summary,address=excluded.address;
 else delete from public.truinexa_public_leads where id=new.id;
 end if;
 return new;
end $$;
revoke all on function truinexa_private.sync_public_lead() from public,anon,authenticated;
update public.truinexa_public_leads p set address=l.address
from public.truinexa_leads l where p.id=l.id;
-- Existing RLS and SELECT-only grants remain unchanged.
