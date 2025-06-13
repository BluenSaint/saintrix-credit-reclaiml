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

-- 2. admins
create table if not exists admins (
  id uuid primary key references auth.users(id),
  role text not null default 'admin',
  created_at timestamp with time zone default now() not null
);

-- 3. settings
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 4. disputes
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

-- 5. documents
drop table if exists documents cascade;
create table documents (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  type text not null,
  file_url text not null,
  created_at timestamp with time zone default now() not null
);

-- 6. referrals
drop table if exists referrals cascade;
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  referral_code text not null,
  referred_by uuid references clients(id),
  redeemed boolean default false not null
);

-- 7. feedback
drop table if exists feedback cascade;
create table feedback (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  message text not null,
  rating int not null,
  created_at timestamp with time zone default now() not null
);

-- 8. admin_notifications
create table if not exists admin_notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  message text not null,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default now() not null,
  read boolean default false
);

-- 9. admin_log
create table if not exists admin_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references auth.users(id) not null,
  action text not null,
  target_user_id uuid references auth.users(id),
  details jsonb,
  created_at timestamp with time zone default now() not null
);

-- 10. flagged_clients
create table if not exists flagged_clients (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  reason text not null,
  created_at timestamp with time zone default now() not null,
  status text default 'open' check (status in ('open', 'acknowledged', 'follow_up', 'resolved'))
);

-- 11. subscriptions
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) not null,
  plan text not null,
  status text not null check (status in ('active', 'canceled', 'trialing')),
  amount numeric not null,
  started_at timestamp with time zone default now() not null,
  ended_at timestamp with time zone
);

-- 12. tasks
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
alter table admin_notifications enable row level security;
alter table admin_log enable row level security;
alter table flagged_clients enable row level security;
alter table subscriptions enable row level security;
alter table tasks enable row level security;
alter table admins enable row level security;
alter table settings enable row level security;

-- RLS Policies
-- Clients
create policy "Client owns their data" on clients
  for all using (auth.uid() = user_id);
create policy "Admin can access all clients" on clients
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Disputes
create policy "Client owns their disputes" on disputes
  for all using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin can access all disputes" on disputes
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Documents
create policy "Client owns their documents" on documents
  for all using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin can access all documents" on documents
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Referrals
create policy "Client owns their referrals" on referrals
  for all using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin can access all referrals" on referrals
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Feedback
create policy "Client owns their feedback" on feedback
  for all using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin can access all feedback" on feedback
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Admin Notifications
create policy "Admin can access notifications" on admin_notifications
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Admin Log
create policy "Admin can access logs" on admin_log
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Flagged Clients
create policy "Admin can access flagged clients" on flagged_clients
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Subscriptions
create policy "Client owns their subscriptions" on subscriptions
  for all using (client_id in (select id from clients where user_id = auth.uid()));
create policy "Admin can access all subscriptions" on subscriptions
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Tasks
create policy "User owns their tasks" on tasks
  for all using (auth.uid() = user_id);
create policy "Admin can access all tasks" on tasks
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Admins
create policy "Admin can access admin table" on admins
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Settings
create policy "Admin can access settings" on settings
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Indexes
create index if not exists idx_clients_user_id on clients (user_id);
create index if not exists idx_disputes_client_id on disputes (client_id);
create index if not exists idx_documents_client_id on documents (client_id);
create index if not exists idx_referrals_client_id on referrals (client_id);
create index if not exists idx_feedback_client_id on feedback (client_id);
create index if not exists idx_admin_notifications_user_id on admin_notifications (user_id);
create index if not exists idx_admin_log_admin_id on admin_log (admin_id);
create index if not exists idx_flagged_clients_client_id on flagged_clients (client_id);
create index if not exists idx_subscriptions_client_id on subscriptions (client_id);
create index if not exists idx_tasks_user_id on tasks (user_id);
create index if not exists idx_settings_key on settings (key); 