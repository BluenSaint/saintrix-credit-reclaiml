-- Create credit_reports table
create table if not exists credit_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  score integer not null,
  data jsonb not null,
  synced_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- Add indexes
create index if not exists idx_credit_reports_user_id on credit_reports(user_id);
create index if not exists idx_credit_reports_synced_at on credit_reports(synced_at);

-- Enable RLS
alter table credit_reports enable row level security;

-- Create policies
create policy "Users can view own reports"
  on credit_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on credit_reports for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all reports"
  on credit_reports for select
  using (auth.jwt() ->> 'role' = 'admin'); 