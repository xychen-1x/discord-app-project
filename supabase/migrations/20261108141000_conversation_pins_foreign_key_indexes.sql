create index if not exists conversation_pins_message_conversation_idx
  on public.conversation_pins (message_id, conversation_id);

create index if not exists conversation_pins_pinned_by_idx
  on public.conversation_pins (pinned_by);