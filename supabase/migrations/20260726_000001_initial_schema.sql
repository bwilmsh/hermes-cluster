-- Cluster initial schema
-- All tables belong to a user (auth.users via FK). RLS policies enforce
-- per-user access at the row level (added in a separate migration).

-- ── Enum types ──
create type event_type as enum ('EVENT', 'TASK', 'APPOINTMENT', 'HABIT');
create type event_status as enum ('TODO', 'IN_PROGRESS', 'DONE');
create type priority_level as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type recurrence_type as enum ('NONE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'CUSTOM', 'MONTHLY');
create type reminder_lead as enum ('AT_TIME', '5_MIN', '15_MIN', '30_MIN', '1_HOUR', '1_DAY');

-- ── profiles: one row per auth user, holds display info + defaults ──
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'You',
  avatar_color text default '#4866FD',
  default_reminder_lead reminder_lead not null default '15_MIN',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth.users row is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── events: calendar items (events + tasks + appointments) ──
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean not null default false,
  event_type event_type not null default 'EVENT',
  status event_status not null default 'TODO',
  priority priority_level not null default 'MEDIUM',
  location text,
  notes text,
  tags text[] default '{}',
  reminder_lead reminder_lead,           -- null = use profile default
  reminder_sent_at timestamptz,
  source text default 'manual',           -- 'manual' | 'habit' | 'ai' | 'import'
  source_id text,                         -- e.g. habit.id when generated from a habit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_user_start on public.events (user_id, start_time);
create index events_user_status on public.events (user_id, status);

-- ── habits: recurring blocks with wiggle room ──
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  ideal_time time not null,                  -- "HH:MM:SS"
  wiggle_minutes int not null default 0 check (wiggle_minutes >= 0 and wiggle_minutes <= 360),
  duration_minutes int not null default 30 check (duration_minutes >= 1 and duration_minutes <= 1440),
  recurrence recurrence_type not null default 'DAILY',
  days smallint[] default '{}',              -- 0=Sun..6=Sat, used when recurrence=CUSTOM
  color text default '#4866FD',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recurrence <> 'CUSTOM' or (days is not null and array_length(days, 1) > 0))
);
create index habits_user_active on public.habits (user_id, active);

-- ── habit_occurrences: concrete scheduled instances of a habit on a specific day ──
create table public.habit_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  offset_minutes int not null default 0,      -- vs habit.ideal_time; +rescheduled, 0=on time
  status text not null default 'scheduled' check (status in ('scheduled', 'rescheduled', 'done', 'skipped')),
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index habit_occurrences_user_date on public.habit_occurrences (user_id, date);

-- ── due_dates: explicit deadlines. Distinct from tasks (which derive from events) ──
create table public.due_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  priority priority_level not null default 'MEDIUM',
  category text,
  completed boolean not null default false,
  completed_at timestamptz,
  reminder_lead reminder_lead,
  reminder_sent_at timestamptz,
  calendar_event_id uuid references public.events(id) on delete set null, -- auto-added to calendar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index due_dates_user_due on public.due_dates (user_id, due_at);
create index due_dates_user_completed on public.due_dates (user_id, completed);

-- ── ai_messages: persistent Cluster AI chat history (for "remembers details") ──
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_event_ids uuid[] default '{}',     -- events created as a result of this message
  created_at timestamptz not null default now()
);
create index ai_messages_user_created on public.ai_messages (user_id, created_at desc);

-- ── ai_user_facts: learned preferences (e.g. "user prefers lunch at 12:30") ──
create table public.ai_user_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fact text not null,
  category text,                              -- 'preference' | 'pattern' | 'context'
  confidence real not null default 0.5 check (confidence >= 0 and confidence <= 1),
  source_message_id uuid references public.ai_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_user_facts_user on public.ai_user_facts (user_id, confidence desc);

-- ── updated_at trigger function (reused across tables) ──
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger habits_updated_at before update on public.habits
  for each row execute function public.set_updated_at();
create trigger due_dates_updated_at before update on public.due_dates
  for each row execute function public.set_updated_at();
create trigger ai_user_facts_updated_at before update on public.ai_user_facts
  for each row execute function public.set_updated_at();