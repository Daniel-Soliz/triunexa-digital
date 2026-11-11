-- Notificacao assincrona apos confirmacao do registro no banco.
-- A chave usada e a anon publica ja exposta no cliente, nunca a chave service_role.
create or replace function truinexa_private.queue_feedback_notification()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 perform net.http_post(
   url := 'https://wsyxykfhxguhyojitpbl.supabase.co/functions/v1/truinexa-feedback-notify',
   body := jsonb_build_object('session_id',new.session_id),
   headers := jsonb_build_object(
     'Content-Type','application/json',
     'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeXh5a2ZoeGd1aHlvaml0cGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ5MjcsImV4cCI6MjA3MzYzMDkyN30.m2Vla7lLLbmIuzvYqfYZK10yUWabuWH4D2Nj8T1yEw8',
     'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeXh5a2ZoeGd1aHlvaml0cGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ5MjcsImV4cCI6MjA3MzYzMDkyN30.m2Vla7lLLbmIuzvYqfYZK10yUWabuWH4D2Nj8T1yEw8',
     'Origin','https://daniel-soliz.github.io'
   ),
   timeout_milliseconds := 10000
 );
 return new;
exception when others then
 -- Feedback permanece salvo mesmo se a notificacao estiver indisponivel.
 return new;
end;
$$;
revoke all on function truinexa_private.queue_feedback_notification() from public,anon,authenticated;
drop trigger if exists truinexa_queue_feedback_notification on public.truinexa_public_feedback;
create trigger truinexa_queue_feedback_notification
after insert on public.truinexa_public_feedback
for each row execute function truinexa_private.queue_feedback_notification();
