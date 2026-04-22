-- 合作夥伴帳號
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account text unique not null,
  password_hash text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- QR 碼
create table if not exists qr_codes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  code text unique not null,
  total_quota int not null check (total_quota > 0),
  used_quota int not null default 0,
  remaining_quota int not null,
  download_count int not null default 0,
  status text not null default 'active',
  disabled boolean not null default false,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 核銷紀錄
create table if not exists qr_redemptions (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references qr_codes(id) on delete cascade,
  partner_id uuid not null references partners(id),
  redeemed_quota int not null check (redeemed_quota > 0),
  redeemed_by text,
  redeemed_at timestamptz not null default now(),
  note text
);

-- 管理員帳號
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  account text unique not null,
  password_hash text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
