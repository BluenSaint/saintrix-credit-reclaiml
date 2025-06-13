-- Create admins table
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add indexes
create index if not exists idx_admins_role on admins(role);

-- Enable RLS
alter table admins enable row level security;

-- Create policies
create policy "Admins can view all admin records"
  on admins for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can update their own record"
  on admins for update
  using (auth.uid() = id);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
create trigger update_admins_updated_at
  before update on admins
  for each row
  execute function update_updated_at_column(); 