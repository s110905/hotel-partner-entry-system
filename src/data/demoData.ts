import type { QrRecord } from '../types/qr'

export const STORAGE_KEY = 'hotel-partner-entry-qr-demo'

export const initialDemoRecords: QrRecord[] = []

const LEGACY_SEED_IDS = new Set(['seed-sunrise', 'seed-harbor'])

function removeLegacySeedRecords(records: QrRecord[]) {
  return records.filter((record) => !LEGACY_SEED_IDS.has(record.id))
}

export function loadRecords() {
  const saved = window.localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return initialDemoRecords
  }

  try {
    const parsed = JSON.parse(saved) as QrRecord[]
    return removeLegacySeedRecords(parsed)
  } catch {
    return initialDemoRecords
  }
}

export function saveRecords(records: QrRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function createQrRecord(partnerName: string, totalQuota: number): QrRecord {
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 7)
  const slug = partnerName
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .toUpperCase()
    .slice(0, 12)

  return {
    id: crypto.randomUUID(),
    code: `HPES-${slug || 'PARTNER'}-${Date.now()}`,
    partnerName,
    totalQuota,
    usedQuota: 0,
    remainingQuota: totalQuota,
    downloadCount: 0,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    disabled: false,
    redemptions: [],
  }
}
