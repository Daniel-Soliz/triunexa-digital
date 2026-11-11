-- Os contatos importados de diretórios publicos podem ter telefone fixo sem WhatsApp confirmado.
CREATE OR REPLACE FUNCTION public.truinexa_lead_contact_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 new.phone_normalized := public.truinexa_normalize_phone(coalesce(new.phone,''));
 if coalesce(new.whatsapp,'') <> '' then
   new.whatsapp := public.truinexa_normalize_phone(new.whatsapp);
 end if;
 if new.origin = 'Pesquisa web' then
   if new.phone_normalized !~ '^55[1-9][0-9][2-9][0-9]{7,8}$'
     or coalesce(new.source_url,'') !~ '^https?://'
     or new.source_verified_at is null
     or coalesce(new.source_provider,'') = ''
     or coalesce(new.contact_validation_method,'') = '' then
     raise exception 'Diretorio publico exige telefone comercial e fonte rastreavel';
   end if;
   if coalesce(new.whatsapp,'') <> '' and new.whatsapp <> new.phone_normalized then
     raise exception 'WhatsApp publico deve corresponder ao telefone confirmado';
   end if;
   new.contact_type := case when length(new.phone_normalized)=12 then 'fixo'
     when coalesce(new.whatsapp,'') <> '' then 'whatsapp' else 'celular' end;
   return new;
 end if;
 if coalesce(new.phone_normalized,'')='' or length(new.phone_normalized)<>13
   or left(new.phone_normalized,2)<>'55'
   or substring(new.phone_normalized from 5 for 1)<>'9' then
   raise exception 'A TRUINEXA aceita somente número de celular brasileiro válido com DDD';
 end if;
 if coalesce(new.whatsapp,'')='' or new.whatsapp <> new.phone_normalized then
   raise exception 'A TRUINEXA exige WhatsApp confirmado no mesmo número de celular';
 end if;
 if TG_OP='INSERT' and new.origin like 'Prospecção automática%' then
   if new.source_verified_at is null or coalesce(new.source_url,'')=''
      or coalesce(new.source_provider,'')='' or coalesce(new.contact_validation_method,'')='' then
     raise exception 'Lead automático exige fonte e método de validação do contato';
   end if;
   new.responsible_id:='e8ea0404-fa51-47d9-89ae-76dc895dcbab'::uuid;
   new.responsible_name:='Daniel Soliz';
   new.stage:='NOVO LEAD';
 end if;
 if TG_OP='INSERT' and new.origin='Prospecção automática • ChatGPT' then
   if coalesce(new.address,'')='' then raise exception 'Prospecção ChatGPT exige endereço comercial validado'; end if;
   if new.researched_at is null or jsonb_typeof(new.validation_sources)<>'array'
       or jsonb_array_length(new.validation_sources)<1 or coalesce(new.company_summary,'')=''
       or coalesce(new.opportunity_reason,'')='' then
     raise exception 'Prospecção ChatGPT exige pesquisa completa da empresa antes da entrada';
   end if;
 end if;
 return new;
end;
$function$
;
