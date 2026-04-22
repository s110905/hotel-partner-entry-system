import type { QrLifecycleStatus, QrRecord } from '../types/qr'

export function isExpired(record: Pick<QrRecord, 'expiresAt'>) {
  return new Date(record.expiresAt).getTime() < Date.now()
}

export function computeStatus(record: QrRecord): QrLifecycleStatus {
  if (record.disabled) {
    return 'disabled'
  }

  if (isExpired(record)) {
    return 'expired'
  }

  if (record.remainingQuota <= 0) {
    return 'used_up'
  }

  if (record.usedQuota > 0) {
    return 'partial_used'
  }

  return 'active'
}

export function canRedeem(record: QrRecord, amount: number) {
  const status = computeStatus(record)

  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, reason: '本次使用人數必須是大於 0 的整數。' }
  }

  if (status === 'expired') {
    return { ok: false, reason: '此 QR 已過期。' }
  }

  if (status === 'disabled') {
    return { ok: false, reason: '此 QR 已停用。' }
  }

  if (status === 'used_up') {
    return { ok: false, reason: '此 QR 已用完。' }
  }

  if (amount > record.remainingQuota) {
    return { ok: false, reason: '本次使用人數超過剩餘名額。' }
  }

  return { ok: true as const }
}
