-- Notifications & Inbox: least-privilege access, indexes, and preference-aware friend alerts.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.notifications FROM anon, authenticated;
REVOKE SELECT (id, user_id, category, title, body, data, created_at, read_at, archived_at, expires_at)
  ON TABLE public.notifications FROM anon, authenticated;
REVOKE UPDATE (read_at, archived_at) ON TABLE public.notifications FROM anon, authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE (read_at, archived_at) ON TABLE public.notifications TO authenticated;

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

REVOKE ALL PRIVILEGES ON TABLE public.notification_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.notification_settings TO authenticated;

CREATE INDEX IF NOT EXISTS notifications_user_created_at_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_unread_user_created_at_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.send_friend_request(target_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  new_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF target_user IS NULL OR target_user = auth.uid() THEN RAISE EXCEPTION 'Invalid user'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = target_user) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = target_user)
       OR (b.blocker_id = target_user AND b.blocked_id = auth.uid())
  ) THEN RAISE EXCEPTION 'This connection is unavailable'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.user_low_id = least(auth.uid(), target_user)
      AND f.user_high_id = greatest(auth.uid(), target_user)
  ) THEN RAISE EXCEPTION 'You are already friends'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.friend_requests r
    WHERE r.status = 'pending'
      AND ((r.sender_id = auth.uid() AND r.receiver_id = target_user)
        OR (r.sender_id = target_user AND r.receiver_id = auth.uid()))
  ) THEN RAISE EXCEPTION 'A pending request already exists'; END IF;

  INSERT INTO public.friend_requests(sender_id, receiver_id, status)
  VALUES(auth.uid(), target_user, 'pending')
  RETURNING id INTO new_request_id;

  IF COALESCE((
    SELECT ns.friend_enabled
    FROM public.notification_settings ns
    WHERE ns.user_id = target_user
  ), true) THEN
    INSERT INTO public.notifications(user_id, category, title, body, data)
    VALUES (
      target_user,
      'friend',
      'Friend request',
      'You received a friend request.',
      pg_catalog.jsonb_build_object(
        'type', 'friend_request',
        'from_user_id', auth.uid(),
        'request_id', new_request_id
      )
    );
  END IF;

  RETURN new_request_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.respond_friend_request(request_id uuid, accept_request boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  request_row public.friend_requests%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO request_row
  FROM public.friend_requests
  WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Friend request not found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = request_row.sender_id)
       OR (b.blocker_id = request_row.sender_id AND b.blocked_id = auth.uid())
  ) THEN RAISE EXCEPTION 'This connection is unavailable'; END IF;

  UPDATE public.friend_requests
  SET status = CASE WHEN accept_request THEN 'accepted' ELSE 'declined' END,
      responded_at = pg_catalog.now()
  WHERE id = request_id;

  IF accept_request THEN
    INSERT INTO public.friendships(user_low_id, user_high_id)
    VALUES (
      least(auth.uid(), request_row.sender_id),
      greatest(auth.uid(), request_row.sender_id)
    )
    ON CONFLICT DO NOTHING;

    IF COALESCE((
      SELECT ns.friend_enabled
      FROM public.notification_settings ns
      WHERE ns.user_id = request_row.sender_id
    ), true) THEN
      INSERT INTO public.notifications(user_id, category, title, body, data)
      VALUES (
        request_row.sender_id,
        'friend',
        'Friend request accepted',
        'Your friend request was accepted.',
        pg_catalog.jsonb_build_object(
          'type', 'friend_request_accepted',
          'from_user_id', auth.uid(),
          'request_id', request_row.id
        )
      );
    END IF;
  END IF;
END;
$function$;
