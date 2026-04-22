import QRCode from 'qrcode'
import type { QrRecord } from '../types/qr'

export function buildQrPayload(record: QrRecord) {
  return JSON.stringify({
    code: record.code,
    partnerName: record.partnerName,
    expiresAt: record.expiresAt,
  })
}

export async function generateQrDataUrl(record: QrRecord) {
  return QRCode.toDataURL(buildQrPayload(record), {
    margin: 1,
    width: 220,
    color: {
      dark: '#0f172a',
      light: '#fff8eb',
    },
  })
}
