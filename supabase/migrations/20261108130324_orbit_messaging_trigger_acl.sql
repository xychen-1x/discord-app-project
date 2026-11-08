-- Keep the trigger callable only through the messages INSERT event.
revoke all on function public.handle_new_conversation_message() from public, anon, authenticated;
