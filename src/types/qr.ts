export type QrLifecycleStatus =
  | 'active'
  | 'partial_used'
  | 'used_up'
  | 'expired'
  | 'disabled'

export type RedemptionRecord = {
  id: string
  redeemedQuota: number
  redeemedAt: string
}

export type QrRecord = {
  id: string
  code: string
  partnerName: string
  totalQuota: number
  usedQuota: number
  remainingQuota: number
  downloadCount: number
  createdAt: string
  expiresAt: string
  disabled: boolean
  redemptions: RedemptionRecord[]
}

export type PartnerSummary = {
  partnerName: string
  qrCount: number
  downloadCount: number
  totalQuota: number
  usedQuota: number
  remainingQuota: number
  expiredUnusedQuota: number
}
