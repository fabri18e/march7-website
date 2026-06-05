-- ================================================================
-- March7 Store — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

-- Profiles (auto-created on user signup)
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Orders
-- items jsonb shape: [{ product_id, name, quantity, unit_price, total }]
-- shipping_address jsonb shape: { line1, line2, city, state, postal_code, country }
create table if not exists public.orders (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references auth.users(id) on delete set null,
  stripe_session_id  text unique not null,
  email              text not null,
  total_amount       integer not null,   -- in cents
  status             text default 'paid'
    check (status in ('paid','processing','shipped','delivered','refunded','cancelled')),
  items              jsonb not null,
  shipping_address   jsonb,
  tracking_number    text,
  tracking_url       text,
  estimated_delivery date,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Migration: run this if the table already exists without tracking columns
-- alter table public.orders add column if not exists tracking_number text;
-- alter table public.orders add column if not exists tracking_url text;
-- alter table public.orders add column if not exists estimated_delivery date;
-- alter table public.orders add column if not exists shipping_address jsonb;

-- Migration: run this if the products table already exists without these columns
-- alter table public.products add column if not exists images text[] not null default '{}';
-- alter table public.products add column if not exists free_shipping boolean not null default false;

-- Products (managed via admin panel — replaces data/products.json)
create table if not exists public.products (
  id              text primary key,           -- slug, e.g. "wireless-earbuds-pro"
  name            text not null,
  price           numeric(10,2) not null,
  old_price       numeric(10,2),
  description     text not null default '',
  short_desc      text not null default '',
  category        text not null default '',
  tags            text[] not null default '{}',
  badge           text,                        -- 'Best Seller' | 'Sale' | 'New' | null
  image           text,                        -- URL
  features        text[] not null default '{}',
  specs           jsonb not null default '[]', -- [[label, value], ...]
  pros            text[] not null default '{}',
  cons            text[] not null default '{}',
  supplier_url    text,                        -- AliExpress product URL
  supplier_price  numeric(10,2),               -- your cost from AliExpress
  images          text[] not null default '{}', -- gallery image URLs
  free_shipping   boolean not null default false,
  active          boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.products enable row level security;

-- Anyone can read active products
create policy "Public can read active products"
  on public.products for select using (active = true);

-- Only service role (admin API) can write
create policy "Service role manages products"
  on public.products for all using (auth.role() = 'service_role');

create trigger products_updated_at
  before update on public.products
  for each row execute procedure update_updated_at();

alter table public.orders enable row level security;

-- Users see only their own orders
create policy "Users can view their own orders"
  on public.orders for select using (auth.uid() = user_id);

-- Service role (webhooks) can do everything
create policy "Service role full access"
  on public.orders for all using (auth.role() = 'service_role');

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
