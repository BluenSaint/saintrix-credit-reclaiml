-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. clients
drop table if exists clients cascade;
create table clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  full_name text not null,
  dob date not null,
  address text not null,
  ssn_last4 text not null,
  created_at timestamp with time zone default now() not null,
  credit_insurance_enabled boolean default false not null
);

-- insurance_log for credit insurance activations
drop table if exists insurance_log cascade;
create table insurance_log (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  enabled_by_admin_id uuid references auth.users(id) not null,
  timestamp timestamp with time zone default now() not null
);

-- 2. disputes
drop table if exists disputes cascade;
create table disputes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  bureau text check (bureau in ('Experian', 'Equifax', 'TransUnion')) not null,
  reason text not null,
  status text check (status in ('draft', 'sent', 'resolved')) not null,
  evidence_url text,
  created_at timestamp with time zone default now() not null
);

-- 3. documents
drop table if exists documents cascade;
create table documents (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  type text not null,
  file_url text not null,
  created_at timestamp with time zone default now() not null
);

-- 4. referrals
drop table if exists referrals cascade;
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  referral_code text not null,
  referred_by uuid references clients(id),
  redeemed boolean default false not null
);

-- 5. feedback
drop table if exists feedback cascade;
create table feedback (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  message text not null,
  rating int not null,
  created_at timestamp with time zone default now() not null
);

-- 6. admin_notifications
create table if not exists admin_notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- e.g. 'dispute', 'legacy_signup', 'upload', 'warning'
  message text not null,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default now() not null,
  read boolean default false
);

-- 7. admin_log
create table if not exists admin_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references auth.users(id) not null,
  action text not null,
  target_user_id uuid references auth.users(id),
  details jsonb,
  created_at timestamp with time zone default now() not null
);

-- 8. flagged_clients
create table if not exists flagged_clients (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  reason text not null,
  created_at timestamp with time zone default now() not null,
  status text default 'open' -- open, acknowledged, follow_up, resolved
);

-- 9. subscriptions
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  plan text not null,
  status text not null, -- active, canceled, trialing, etc.
  amount numeric not null,
  started_at timestamp with time zone default now() not null,
  ended_at timestamp with time zone
);

-- 10. tasks (for dashboard to-do list)
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  due_date date,
  priority text check (priority in ('low', 'medium', 'high')) default 'low',
  completed boolean default false,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS for all tables
alter table clients enable row level security;
alter table disputes enable row level security;
alter table documents enable row level security;
alter table referrals enable row level security;
alter table feedback enable row level security;

-- RLS: clients (client can see/edit own, admin can see all)
create policy "Client owns their data" on clients
  for all
  using (auth.uid() = user_id);
create policy "Admin override" on clients
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- RLS: disputes
create policy "Client owns their data" on disputes
  for all
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin override" on disputes
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- RLS: documents
create policy "Client owns their data" on documents
  for all
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin override" on documents
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- RLS: referrals
create policy "Client owns their data" on referrals
  for all
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin override" on referrals
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- RLS: feedback
create policy "Client owns their data" on feedback
  for all
  using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin override" on feedback
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- INDEX OPTIMIZATION
create index if not exists idx_clients_user_id on clients (user_id);
create index if not exists idx_disputes_user_id on disputes (client_id);
create index if not exists idx_documents_user_id on documents (client_id);
create index if not exists idx_referrals_user_id on referrals (client_id);
create index if not exists idx_feedback_user_id on feedback (client_id);

-- RLS POLICIES (SAFE, USER-SCOPED)
-- 1. For all tables with a user_id field
alter table clients enable row level security;
create policy if not exists "User can select own client row" on clients for select using (auth.uid() = user_id);
create policy if not exists "User can insert own client row" on clients for insert with check (auth.uid() = user_id);
create policy if not exists "User can update own client row" on clients for update using (auth.uid() = user_id);
create policy if not exists "User can delete own client row" on clients for delete using (auth.uid() = user_id);

alter table disputes enable row level security;
create policy if not exists "User can select own dispute" on disputes for select using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can insert own dispute" on disputes for insert with check (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can update own dispute" on disputes for update using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can delete own dispute" on disputes for delete using (client_id in (select id from clients where user_id = auth.uid()));

alter table documents enable row level security;
create policy if not exists "User can select own document" on documents for select using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can insert own document" on documents for insert with check (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can update own document" on documents for update using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can delete own document" on documents for delete using (client_id in (select id from clients where user_id = auth.uid()));

alter table referrals enable row level security;
create policy if not exists "User can select own referral" on referrals for select using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can insert own referral" on referrals for insert with check (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can update own referral" on referrals for update using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can delete own referral" on referrals for delete using (client_id in (select id from clients where user_id = auth.uid()));

alter table feedback enable row level security;
create policy if not exists "User can select own feedback" on feedback for select using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can insert own feedback" on feedback for insert with check (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can update own feedback" on feedback for update using (client_id in (select id from clients where user_id = auth.uid()));
create policy if not exists "User can delete own feedback" on feedback for delete using (client_id in (select id from clients where user_id = auth.uid()));

-- 2. Admins table
alter table admins enable row level security;
create policy if not exists "Admin can select self" on admins for select using (auth.uid() = id);
create policy if not exists "Admin can insert self" on admins for insert with check (auth.uid() = id);

-- 3. Settings table
alter table settings enable row level security;
create policy if not exists "Admin can access settings" on settings for all using (auth.uid() in (select id from admins));

-- 4. Tasks table
create index if not exists idx_tasks_user_id on tasks (user_id); 