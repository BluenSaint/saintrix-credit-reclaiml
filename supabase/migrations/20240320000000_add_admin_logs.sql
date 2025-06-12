-- Create admin_logs table
create table if not exists admin_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references auth.users(id) not null,
  action text not null,
  target_user_id uuid references auth.users(id) not null,
  timestamp timestamp with time zone default now() not null,
  file_type text,
  file_name text,
  details jsonb
);

-- Add indexes for better query performance
create index if not exists idx_admin_logs_admin_id on admin_logs(admin_id);
create index if not exists idx_admin_logs_target_user_id on admin_logs(target_user_id);
create index if not exists idx_admin_logs_timestamp on admin_logs(timestamp);

-- Enable RLS
alter table admin_logs enable row level security;

-- Create policies
create policy "Admins can view all logs"
  on admin_logs for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can insert logs"
  on admin_logs for insert
  with check (auth.jwt() ->> 'role' = 'admin'); 