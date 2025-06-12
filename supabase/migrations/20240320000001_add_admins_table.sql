-- Create admins table
create table if not exists admins (
  id uuid primary key references auth.users(id) not null,
  role text not null default 'admin',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add indexes
create index if not exists idx_admins_role on admins(role);

-- Enable RLS
alter table admins enable row level security;

-- Create policies
create policy "Admins can view all admins"
  on admins for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can insert new admins"
  on admins for insert
  with check (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can update admin roles"
  on admins for update
  using (auth.jwt() ->> 'role' = 'admin');

-- Add trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_admins_updated_at
  before update on admins
  for each row
  execute function update_updated_at_column(); 