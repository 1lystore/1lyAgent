-- 1ly Agent Commerce Demo schema
-- Safe for public repo: no secrets, only table definitions.

create extension if not exists "pgcrypto";

create table if not exists agent_state (
  id uuid primary key default gen_random_uuid(),
  store_id text,
  store_username text,
  bootstrap_status text not null default 'PENDING',
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  source text not null check (source in ('human_ui','external_agent')),
  classification text check (classification in ('FREE','PAID_MEDIUM','PAID_HEAVY','COFFEE_ORDER')),
  price_usdc numeric(10,2) not null default 0,
  status text not null check (status in ('NEW','LINK_CREATED','PAID','FULFILLED','FAILED')),
  payment_link text,
  payment_ref text,
  deliverable text,
  callback_url text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete set null,
  purpose text not null check (purpose in ('PAID_REQUEST','COFFEE_TIP','COFFEE_ORDER')),
  amount_usdc numeric(10,2) not null,
  status text not null check (status in ('PENDING','CONFIRMED','FAILED')),
  provider_ref text,
  source text not null check (source in ('1ly_call','1ly_link','admin_demo')),
  created_at timestamptz not null default now()
);

create table if not exists coffee_orders (
  id uuid primary key default gen_random_uuid(),
  order_text text not null,
  estimated_cost_usdc numeric(10,2) not null,
  final_price_usdc numeric(10,2) not null,
  sponsor_type text not null default 'human' check (sponsor_type in ('human','agent')),
  status text not null check (status in ('LINK_CREATED','PAID_PENDING','QUEUED','EXECUTING','FUNDING_ACQUIRED','ORDER_PLACED','DELIVERED','FAILED')),
  bitrefill_order_id text,
  gift_last4 text,
  swiggy_order_id text,
  provider_status text,
  execution_day date,
  created_at timestamptz not null default now()
);

create table if not exists coffee_state (
  id uuid primary key default gen_random_uuid(),
  coffee_balance_usdc numeric(10,2) not null default 0,
  daily_exec_count integer not null default 0,
  next_batch_ts timestamptz,
  last_reset_ts timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into coffee_state (coffee_balance_usdc, daily_exec_count)
select 0, 0
where not exists (select 1 from coffee_state);

create index if not exists idx_requests_created_at on requests(created_at desc);
create index if not exists idx_requests_status on requests(status);
create index if not exists idx_coffee_orders_status on coffee_orders(status);
