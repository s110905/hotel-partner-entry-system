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

type ViewKey = 'partner' | 'scan' | 'admin'

function App() {
  const [view, setView] = useState<ViewKey>('partner')
  const [session, setSession] = useState<AuthSession | null>(null)
  const [records, setRecords] = useState<QrRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecords()
      .then(setRecords)
      .catch(() => setError('無法載入資料，請確認 Supabase 連線設定。'))
      .finally(() => setLoading(false))
  }, [])

  const handleAddRecord = async (partnerName: string, totalQuota: number) => {
    const newRecord = await insertQrRecord(partnerName, totalQuota)
    setRecords((prev) => [newRecord, ...prev])
  }

  const handleRedeem = async (id: string, amount: number) => {
    const record = records.find((r) => r.id === id)
    if (!record) return
    const updated = await redeemQr(id, amount, record)
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

  const handleViewChange = (newView: ViewKey) => {
    if (newView === view) return
    setView(newView)
    if (newView === 'scan') return
    if (session && (session.role as string) === newView) return
    setSession(null)
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

  const needsAuth = (view === 'partner' && (!session || session.role !== 'partner')) ||
                   (view === 'admin' && (!session || session.role !== 'admin'))

  if (needsAuth) {
    return (
      <div className="app-shell">
        <nav className="tab-bar-container">
          <div className="tab-bar" aria-label="主要區塊">
            <button className={view === 'partner' ? 'active' : ''} onClick={() => handleViewChange('partner')} type="button">
              發放憑證 (Partner)
            </button>
            <button className={(view as any) === 'scan' ? 'active' : ''} onClick={() => handleViewChange('scan')} type="button">
              現場核銷 (Scan)
            </button>
            <button className={view === 'admin' ? 'active' : ''} onClick={() => handleViewChange('admin')} type="button">
              管理後台 (Admin)
            </button>
          </div>
        </nav>
        <LoginPage
          onLogin={setSession}
          defaultRole={view === 'admin' ? 'admin' : 'partner'}
          contextLabel={view === 'admin' ? '管理後台（系統管理員）' : '發放憑證（合作飯店）'}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      {view !== 'scan' && (
        <header className="hero-panel">
          <div>
            <p className="eyebrow">展示系統</p>
            <h1>飯店合作夥伴入場管理系統</h1>
            <p className="hero-copy">
              歡迎使用 QR First 入場管理系統。本系統提供合作飯店專屬憑證發放、現場快速掃碼核銷與即時使用狀態追蹤功能，確保入場流程順暢安全。
            </p>
          </div>
          <div className="hero-badges">
            <span>7 天有效期</span>
            <span>多人額度</span>
            <span>可分次核銷</span>
          </div>
        </header>
      )}

      <nav className="tab-bar-container">
        <div className="tab-bar" aria-label="主要區塊">
          <button className={view === 'partner' ? 'active' : ''} onClick={() => handleViewChange('partner')} type="button">
            發放憑證 (Partner)
          </button>
          <button className={(view as any) === 'scan' ? 'active' : ''} onClick={() => handleViewChange('scan')} type="button">
            現場核銷 (Scan)
          </button>
          <button className={view === 'admin' ? 'active' : ''} onClick={() => handleViewChange('admin')} type="button">
            管理後台 (Admin)
          </button>
        </div>
        
        {session && (
          <div className="user-status">
            <span className="user-info">{session.name} ({session.role})</span>
            <button className="logout-btn" onClick={handleLogout}>登出</button>
          </div>
        )}
      </nav>

      <section className="notice-bar">
        <strong>系統公告</strong>
        <span>資料已儲存至 Supabase 雲端資料庫，可跨裝置使用。</span>
      </section>

      {view === 'partner' && (
        <PartnerPanel
          records={records}
          onAdd={handleAddRecord}
          onIncrementDownload={handleIncrementDownload}
        />
      )}
      {view === 'scan' && (
        <ScanPanel records={records} onRedeem={handleRedeem} />
      )}
      {view === 'admin' && (
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
