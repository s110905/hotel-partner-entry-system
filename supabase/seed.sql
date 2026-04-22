insert into partners (id, name, account, password_hash, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo 飯店',
  'demo',
  'demo',
  'active'
)
on conflict (id) do nothing;
