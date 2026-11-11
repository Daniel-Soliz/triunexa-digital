-- Estado interno do encaminhamento de feedback; mensagens continuam privadas no ADM.
ALTER TABLE public.truinexa_public_feedback
  ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notification_attempted_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_error text;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'truinexa_feedback_notification_status_check'
      AND conrelid = 'public.truinexa_public_feedback'::regclass
  ) THEN
    ALTER TABLE public.truinexa_public_feedback
      ADD CONSTRAINT truinexa_feedback_notification_status_check
      CHECK (notification_status IN ('pending','sending','sent','failed'));
  END IF;
END $$;
-- Nao alterar as permissoes: apenas o ADM deve ler feedbacks.
