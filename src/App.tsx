import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchRecords, insertQrRecord, redeemQr, toggleDisable, incrementDownload } from './lib/qrService'
import { AdminPanel } from './features/admin/AdminPanel'
import { PartnerPanel } from './features/partner/PartnerPanel'
import { ScanPanel } from './features/scan/ScanPanel'
import { LoginPage } from './features/auth/LoginPage'
import type { AuthSession } from './lib/authService'
import type { PartnerSummary, QrRecord } from './types/qr'
import { computeStatus } from './utils/status'

function App() {
  const [scanMode, setScanMode] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [records, setRecords] = useState<QrRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanUnlocked, setScanUnlocked] = useState(false)

  useEffect(() => {
    fetchRecords()
      .then(setRecords)
      .catch(() => setError('無法載入資料，請確認 Supabase 連線設定。'))
      .finally(() => setLoading(false))
  }, [])

  const handleAddRecord = async (partnerName: string, totalQuota: number) => {
    const partnerId = session?.id ?? ''
    const newRecord = await insertQrRecord(partnerName, totalQuota, partnerId)
    setRecords((prev) => [newRecord, ...prev])
  }

  const handleRedeem = async (id: string, amount: number) => {
    const record = records.find((r) => r.id === id)
    if (!record) return
    // If not admin/partner session (i.e. scan view), use default ID for now
    const partnerId = session?.id ?? '00000000-0000-0000-0000-000000000001'
    const updated = await redeemQr(id, amount, record, partnerId)
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)))
  }

  const handleToggleDisable = async (id: string, disabled: boolean) => {
    await toggleDisable(id, disabled)
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, disabled } : r))
    )
  }

  const handleIncrementDownload = async (id: string) => {
    await incrementDownload(id)
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, downloadCount: r.downloadCount + 1 } : r))
    )
  }

  const handleLogout = () => {
    setSession(null)
  }

  const partnerSummaries = useMemo<PartnerSummary[]>(() => {
    const partnerMap = new Map<string, PartnerSummary>()
    records.forEach((record) => {
      const status = computeStatus(record)
      const current = partnerMap.get(record.partnerName) ?? {
        partnerName: record.partnerName,
        qrCount: 0,
        downloadCount: 0,
        totalQuota: 0,
        usedQuota: 0,
        remainingQuota: 0,
        expiredUnusedQuota: 0,
      }
      current.qrCount += 1
      current.downloadCount += record.downloadCount
      current.totalQuota += record.totalQuota
      current.usedQuota += record.usedQuota
      current.remainingQuota += record.remainingQuota
      current.expiredUnusedQuota += status === 'expired' ? record.remainingQuota : 0
      partnerMap.set(record.partnerName, current)
    })
    return Array.from(partnerMap.values()).sort((a, b) =>
      a.partnerName.localeCompare(b.partnerName, 'zh-Hant')
    )
  }, [records])

  if (loading) {
    return (
      <div className="app-loading">
        <p>載入中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-error">
        <p>{error}</p>
      </div>
    )
  }

  // ── Render: Scan Mode ─────────────────────────────────
  if (scanMode) {
    return (
      <div className="app-shell">
        <ScanPanel 
          records={records} 
          onRedeem={handleRedeem} 
          isUnlocked={scanUnlocked}
          onUnlock={() => setScanUnlocked(true)}
          onBack={() => setScanMode(false)}
        />
      </div>
    )
  }

  // ── Render: Login ─────────────────────────────────────
  if (!session) {
    return (
      <div className="app-shell">
        <LoginPage
          onLogin={setSession}
          onScanMode={() => setScanMode(true)}
          defaultRole="partner"
        />
      </div>
    )
  }

  // ── Render: Authenticated Shell ────────────────────────
  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">展示系統</p>
            <h1>飯店合作夥伴入場管理系統</h1>
            <p className="hero-copy">
              歡迎使用 QR First 入場管理系統。本系統提供合作飯店專屬憑證發放、現場快速掃碼核銷與即時使用狀態追蹤功能。
            </p>
          </div>
          <div className="user-status" style={{ background: 'rgba(255,255,255,0.2)', padding: '12px 18px', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
            <span className="user-info" style={{ color: '#fff', fontWeight: 700, marginRight: 12 }}>
              {session.name} ({session.role === 'admin' ? '管理員' : '合作夥伴'})
            </span>
            <button className="logout-btn" onClick={handleLogout} style={{ background: '#fff', color: '#d45c2f', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              登出
            </button>
          </div>
        </div>
        <div className="hero-badges">
          <span>7 天有效期</span>
          <span>多人額度</span>
          <span>可分次核銷</span>
        </div>
      </header>

      <section className="notice-bar">
        <strong>系統公告</strong>
        <span>資料已儲存至 Supabase 雲端資料庫，可跨裝置使用。</span>
      </section>

      {session.role === 'partner' && (
        <PartnerPanel
          records={records}
          onAdd={handleAddRecord}
          onIncrementDownload={handleIncrementDownload}
        />
      )}
      
      {session.role === 'admin' && (
        <AdminPanel
          partnerSummaries={partnerSummaries}
          records={records}
          onToggleDisable={handleToggleDisable}
        />
      )}
    </div>
  )
}

export default App
