import { supabase } from './supabase'
import type { QrRecord, RedemptionRecord } from '../types/qr'


function toQrRecord(row: Record<string, unknown>): QrRecord {
  const redemptions = Array.isArray(row.qr_redemptions)
    ? (row.qr_redemptions as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        redeemedQuota: r.redeemed_quota as number,
        redeemedAt: r.redeemed_at as string,
      }))
    : []

  return {
    id: row.id as string,
    code: row.code as string,
    partnerName: (row.partners as Record<string, unknown>)?.name as string ?? 'Demo 飯店',
    totalQuota: row.total_quota as number,
    usedQuota: row.used_quota as number,
    remainingQuota: row.remaining_quota as number,
    downloadCount: row.download_count as number,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    disabled: row.disabled as boolean,
    redemptions,
  }
}

export async function fetchRecords(): Promise<QrRecord[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, partners(name), qr_redemptions(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toQrRecord)
}

export async function insertQrRecord(
  partnerName: string,
  totalQuota: number,
  partnerId: string
): Promise<QrRecord> {
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 7)

  const slug = partnerName
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .toUpperCase()
    .slice(0, 12)

  const code = `HPES-${slug || 'PARTNER'}-${Date.now()}`

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      partner_id: partnerId,
      code,
      total_quota: totalQuota,
      used_quota: 0,
      remaining_quota: totalQuota,
      download_count: 0,
      status: 'active',
      disabled: false,
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('*, partners(name), qr_redemptions(*)')
    .single()

  if (error) throw error
  return toQrRecord(data)
}

export async function incrementDownload(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_download', { qr_id: id })
  if (error) {
    // Fallback if RPC is not defined
    await supabase
      .from('qr_codes')
      .select('download_count')
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (data) {
          await supabase
            .from('qr_codes')
            .update({ download_count: (data.download_count as number) + 1 })
            .eq('id', id)
        }
      })
  }
}

export async function redeemQr(
  id: string,
  amount: number,
  currentRecord: QrRecord,
  partnerId: string
): Promise<QrRecord> {
  const { data, error } = await supabase.rpc('redeem_qr', {
    p_qr_code_id: id,
    p_amount: amount,
    p_partner_id: partnerId,
    p_redeemed_by: null,
  })

  if (error) throw new Error('核銷失敗，請確認網路連線或稍後再試。')
  if (!data.ok) throw new Error(data.reason)

  const newRedemption: RedemptionRecord = {
    id: data.redemption_id as string,
    redeemedQuota: amount,
    redeemedAt: new Date().toISOString(),
  }

  return {
    ...currentRecord,
    usedQuota: data.used_quota as number,
    remainingQuota: data.remaining_quota as number,
    redemptions: [...currentRecord.redemptions, newRedemption],
  }
}

export async function toggleDisable(id: string, disabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('qr_codes')
    .update({ disabled, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
