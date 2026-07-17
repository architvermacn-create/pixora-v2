-- Run this in your Supabase SQL editor (project: slabgzxsatxllkqizkuv)

-- Profiles table (likely already exists)
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  email text,
  full_name text,
  avatar_url text default '',
  credits integer default 10,
  plan text default 'free',
  stripe_customer_id text default '',
  clerk_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generations table
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  prompt text,
  output_url text,
  status text default 'processing',
  credits_used integer default 1,
  created_at timestamptz default now()
);

-- Credit transactions table
create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  amount integer not null,
  type text not null,
  payment_id text,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table generations enable row level security;
alter table credit_transactions enable row level security;

create policy if not exists "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy if not exists "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy if not exists "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy if not exists "Users can read own generations" on generations for select using (auth.uid() = user_id);
create policy if not exists "Users can insert own generations" on generations for insert with check (auth.uid() = user_id);
create policy if not exists "Users can update own generations" on generations for update using (auth.uid() = user_id);

create policy if not exists "Users can read own transactions" on credit_transactions for select using (auth.uid() = user_id);
create policy if not exists "Users can insert own transactions" on credit_transactions for insert with check (auth.uid() = user_id);

-- Function: auto-create profile on signup with 10 free credits
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits, plan)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 10, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
