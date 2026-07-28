-- Row-Level Security: each user can only see/modify their own rows.
-- auth.uid() returns the UUID of the currently authenticated user.

-- ── Enable RLS ──
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.habits enable row level security;
alter table public.habit_occurrences enable row level security;
alter table public.due_dates enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_user_facts enable row level security;

-- ── profiles ──
-- Users can read/write their own profile row only.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ── events ──
create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);
create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);

-- ── habits ──
create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- ── habit_occurrences ──
create policy "habit_occurrences_select_own" on public.habit_occurrences
  for select using (auth.uid() = user_id);
create policy "habit_occurrences_insert_own" on public.habit_occurrences
  for insert with check (auth.uid() = user_id);
create policy "habit_occurrences_update_own" on public.habit_occurrences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_occurrences_delete_own" on public.habit_occurrences
  for delete using (auth.uid() = user_id);

-- ── due_dates ──
create policy "due_dates_select_own" on public.due_dates
  for select using (auth.uid() = user_id);
create policy "due_dates_insert_own" on public.due_dates
  for insert with check (auth.uid() = user_id);
create policy "due_dates_update_own" on public.due_dates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "due_dates_delete_own" on public.due_dates
  for delete using (auth.uid() = user_id);

-- ── ai_messages ──
create policy "ai_messages_select_own" on public.ai_messages
  for select using (auth.uid() = user_id);
create policy "ai_messages_insert_own" on public.ai_messages
  for insert with check (auth.uid() = user_id);
create policy "ai_messages_delete_own" on public.ai_messages
  for delete using (auth.uid() = user_id);

-- ── ai_user_facts ──
create policy "ai_user_facts_select_own" on public.ai_user_facts
  for select using (auth.uid() = user_id);
create policy "ai_user_facts_insert_own" on public.ai_user_facts
  for insert with check (auth.uid() = user_id);
create policy "ai_user_facts_update_own" on public.ai_user_facts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_user_facts_delete_own" on public.ai_user_facts
  for delete using (auth.uid() = user_id);