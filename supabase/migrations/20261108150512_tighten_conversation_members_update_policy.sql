BEGIN;

REVOKE UPDATE
ON TABLE public.conversation_members
FROM authenticated;

GRANT UPDATE (last_read_at, is_muted)
ON TABLE public.conversation_members
TO authenticated;

DROP POLICY IF EXISTS
  "Users can update their own conversation read state"
ON public.conversation_members;

CREATE POLICY
  "Users can update their own conversation read state"
ON public.conversation_members
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND private.is_conversation_member(conversation_id)
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND private.is_conversation_member(conversation_id)
);

COMMIT;
