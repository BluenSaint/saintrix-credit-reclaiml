-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create clients table
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create disputes table
create table if not exists public.disputes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  bureau text not null,
  status text not null default 'pending',
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create documents table
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  url text not null,
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.clients enable row level security;
alter table public.disputes enable row level security;
alter table public.documents enable row level security;

-- Create RLS policies for clients table
create policy "Users can view their own client profile"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can update their own client profile"
  on public.clients for update
  using (auth.uid() = user_id);

-- Create RLS policies for disputes table
create policy "Users can view their own disputes"
  on public.disputes for select
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "Users can create their own disputes"
  on public.disputes for insert
  with check (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "Users can update their own disputes"
  on public.disputes for update
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

-- Create RLS policies for documents table
create policy "Users can view their own documents"
  on public.documents for select
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "Users can upload their own documents"
  on public.documents for insert
  with check (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "Users can delete their own documents"
  on public.documents for delete
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.clients (user_id, name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 