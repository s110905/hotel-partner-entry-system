insert into admin_users (id, account, password_hash, name, status)
values (
  '00000000-0000-0000-0000-000000000002',
  'admin',
  'admin',
  '系統管理員',
  'active'
)
on conflict (id) do nothing;
