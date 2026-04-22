create or replace function redeem_qr(
  p_qr_code_id uuid,
  p_amount int,
  p_partner_id uuid,
  p_redeemed_by text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_qr qr_codes%rowtype;
  v_redemption_id uuid;
  v_new_used int;
  v_new_remaining int;
  v_new_status text;
begin
  -- 鎖定該列，防止競態
  select * into v_qr
  from qr_codes
  where id = p_qr_code_id
  for update;

  if not found then
    return json_build_object('ok', false, 'reason', 'QR 不存在');
  end if;

  if v_qr.disabled then
    return json_build_object('ok', false, 'reason', '此 QR 已停用');
  end if;

  if v_qr.expires_at < now() then
    return json_build_object('ok', false, 'reason', '此 QR 已過期');
  end if;

  if v_qr.remaining_quota <= 0 then
    return json_build_object('ok', false, 'reason', '此 QR 已用完');
  end if;

  if p_amount > v_qr.remaining_quota then
    return json_build_object('ok', false, 'reason', '本次使用人數超過剩餘名額');
  end if;

  v_new_used := v_qr.used_quota + p_amount;
  v_new_remaining := v_qr.remaining_quota - p_amount;

  if v_new_remaining <= 0 then
    v_new_status := 'used_up';
  elsif v_new_used > 0 then
    v_new_status := 'partial_used';
  else
    v_new_status := 'active';
  end if;

  update qr_codes
  set
    used_quota = v_new_used,
    remaining_quota = v_new_remaining,
    status = v_new_status,
    updated_at = now()
  where id = p_qr_code_id;

  insert into qr_redemptions (qr_code_id, partner_id, redeemed_quota, redeemed_by, redeemed_at)
  values (p_qr_code_id, p_partner_id, p_amount, p_redeemed_by, now())
  returning id into v_redemption_id;

  return json_build_object(
    'ok', true,
    'redemption_id', v_redemption_id,
    'used_quota', v_new_used,
    'remaining_quota', v_new_remaining,
    'status', v_new_status
  );
end;
$$;

-- 授予執行權限
grant execute on function redeem_qr(uuid, int, uuid, text) to anon;
