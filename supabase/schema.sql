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
  created_at timestamp with time zone default now() not null
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