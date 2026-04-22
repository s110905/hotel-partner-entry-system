import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, Download, Hash, Users } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import type { QrRecord } from '../../types/qr'
import { computeStatus } from '../../utils/status'
import './QRCard.css'

type QRCardProps = {
  record: QrRecord
  compact?: boolean
  onIncrementDownload: (id: string) => Promise<void>
}

const STATUS_MAP = {
  active: { label: '可使用', tone: 'active' },
  partial_used: { label: '部分使用', tone: 'partial' },
  used_up: { label: '已用完', tone: 'used' },
  expired: { label: '已過期', tone: 'expired' },
  disabled: { label: '已停用', tone: 'disabled' },
} as const

export function QRCard({ record, compact = false, onIncrementDownload }: QRCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloading, setDownloading] = useState(false)
  const status = computeStatus(record)
  const style = STATUS_MAP[status]
  const shortCode = record.code.split('-').pop() ?? record.code

  useEffect(() => {
    if (!canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, record.code, {
      width: compact ? 132 : 180,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
  }, [compact, record.code])

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450))
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, record.code, {
        width: 920,
        margin: 3,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      })

      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = 1120
      exportCanvas.height = 1320
      const context = exportCanvas.getContext('2d')

      if (!context) {
        throw new Error('Unable to create export canvas context')
      }

      context.fillStyle = '#fffdf8'
      context.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

      context.fillStyle = '#183153'
      context.font = 'bold 54px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
      context.fillText(record.partnerName, 100, 108)

      context.fillStyle = '#64748b'
      context.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
      context.fillText('請出示此 QR 供現場核銷使用', 100, 156)

      context.drawImage(qrCanvas, 100, 220, 920, 920)

      context.fillStyle = '#0f172a'
      context.font = 'bold 42px "Courier New", monospace'
      context.fillText(`序號：${record.code}`, 100, 1190)

      context.fillStyle = '#7c5a43'
      context.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
      context.fillText(
        `到期日：${new Date(record.expiresAt).toLocaleDateString('zh-TW')}`,
        100,
        1240,
      )

      const dataUrl = exportCanvas.toDataURL('image/png')
      await onIncrementDownload(record.id)

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `QR-${record.partnerName}-${record.code}.png`
      link.click()
    } catch (error) {
      console.error('Failed to generate QR for download', error)
    } finally {
      window.setTimeout(() => setDownloading(false), 1500)
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, boxShadow: '0 18px 32px rgba(15, 23, 42, 0.1)' }}
      className={`glass-card qr-card ${compact ? 'qr-card-compact' : ''}`}
    >
      <div className="qr-card-header">
        <div>
          <h4>{record.partnerName}</h4>
          <div className="qr-card-meta">
            <span className={`qr-status-pill qr-status-${style.tone}`}>{style.label}</span>
            <span className="qr-code-chip">
              <Hash size={12} />
              {shortCode}
            </span>
          </div>
        </div>
      </div>

      <div className="qr-canvas-wrap">
        <canvas ref={canvasRef} />
        <div className="qr-serial-block">
          <span className="qr-serial-label">人工核銷序號</span>
          <strong className="qr-serial-value">{record.code}</strong>
        </div>
      </div>

      <div className="qr-card-stats">
        <div className="qr-stat-box">
          <span className="qr-stat-label">
            <Users size={12} />
            名額概況
          </span>
          <strong>{record.remainingQuota}</strong>
          <small>/ {record.totalQuota} 剩餘，已用 {record.usedQuota}</small>
        </div>

        <div className="qr-stat-box">
          <span className="qr-stat-label">
            <Clock size={12} />
            時間資訊
          </span>
          <strong>{new Date(record.createdAt).toLocaleDateString('zh-TW')}</strong>
          <small>到期：{new Date(record.expiresAt).toLocaleDateString('zh-TW')}</small>
        </div>
      </div>

      <button type="button" onClick={handleDownload} disabled={downloading} className="btn-primary qr-download-btn">
        <AnimatePresence mode="wait">
          {downloading ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="qr-download-label"
            >
              <CheckCircle2 size={18} />
              已完成下載
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="qr-download-label"
            >
              <Download size={18} />
              下載 QR 憑證
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.article>
  )
}
