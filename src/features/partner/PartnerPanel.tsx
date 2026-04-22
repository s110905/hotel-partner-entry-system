import { motion } from 'framer-motion'
import { ClipboardList, Clock, Download, QrCode, TrendingUp } from 'lucide-react'
import { CreateQRForm } from '../../components/partner/CreateQRForm'
import { QRList } from '../../components/partner/QRList'
import { isExpired } from '../../utils/status'
import type { QrRecord } from '../../types/qr'
import './PartnerPanel.css'

type PartnerPanelProps = {
  records: QrRecord[]
  onAdd: (partnerName: string, totalQuota: number) => Promise<void>
  onIncrementDownload: (id: string) => Promise<void>
}

export function PartnerPanel({ records, onAdd, onIncrementDownload }: PartnerPanelProps) {
  const handleAddRecord = async (partnerName: string, totalQuota: number) => {
    await onAdd(partnerName, totalQuota)
  }

  const stats = {
    issuedCount: records.length,
    downloadCount: records.reduce((acc, record) => acc + record.downloadCount, 0),
    totalQuota: records.reduce((acc, record) => acc + record.totalQuota, 0),
    usedQuota: records.reduce((acc, record) => acc + record.usedQuota, 0),
    expiredCount: records.filter(isExpired).length,
  }

  const remainingQuota = stats.totalQuota - stats.usedQuota
  const redeemRate =
    stats.totalQuota > 0 ? Math.round((stats.usedQuota / stats.totalQuota) * 100) : 0

  return (
    <section className="partner-panel">
      <div className="partner-intro">
        <div>
          <h2 className="partner-title">發放憑證管理</h2>
          <p className="partner-subtitle">
            您可以從這裡快速建立旅客入場憑證，並追蹤整體名額發放、下載與核銷進度。
          </p>
        </div>
        <div className="partner-sync-chip">
          <Clock size={14} />
          <span>最後同步時間：{new Date().toLocaleTimeString('zh-TW')}</span>
        </div>
      </div>

      <div className="partner-stat-grid">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card partner-stat-card"
        >
          <div className="partner-stat-header">
            <div className="partner-stat-icon partner-stat-icon-indigo">
              <QrCode size={22} />
            </div>
            <span className="partner-stat-badge">憑證數量</span>
          </div>
          <strong className="partner-stat-value">{stats.issuedCount}</strong>
          <p className="partner-stat-label">已發行憑證</p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card partner-stat-card"
        >
          <div className="partner-stat-header">
            <div className="partner-stat-icon partner-stat-icon-emerald">
              <TrendingUp size={22} />
            </div>
            <span className="partner-stat-badge">名額概況</span>
          </div>
          <strong className="partner-stat-value">{remainingQuota}</strong>
          <p className="partner-stat-label">總可用名額 / {stats.totalQuota}</p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card partner-stat-card"
        >
          <div className="partner-stat-header">
            <div className="partner-stat-icon partner-stat-icon-amber">
              <Download size={22} />
            </div>
            <span className="partner-stat-badge">分發成效</span>
          </div>
          <strong className="partner-stat-value">{stats.downloadCount}</strong>
          <p className="partner-stat-label">累積下載次數</p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card partner-progress-card"
        >
          <div className="partner-progress-header">
            <span className="partner-progress-title">整體核銷率</span>
            <strong>{redeemRate}%</strong>
          </div>
          <div className="partner-progress-track" aria-hidden="true">
            <motion.div
              className="partner-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${redeemRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="partner-progress-note">
            已核銷 {stats.usedQuota} 人，{stats.expiredCount} 張憑證已過期。
          </p>
        </motion.article>
      </div>

      <div className="partner-layout">
        <aside className="partner-form-column">
          <CreateQRForm onAdd={handleAddRecord} />
        </aside>

        <div className="partner-list-column">
          <div className="partner-list-heading">
            <div className="partner-list-title-wrap">
              <div className="partner-list-icon">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3>憑證清單</h3>
                <p>目前共 {records.length} 張 QR 憑證，可直接搜尋、篩選與下載。</p>
              </div>
            </div>
          </div>

          <QRList records={records} onIncrementDownload={onIncrementDownload} />
        </div>
      </div>
    </section>
  )
}
