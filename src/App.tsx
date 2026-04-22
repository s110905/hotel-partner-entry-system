import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchRecords, insertQrRecord, redeemQr, toggleDisable, incrementDownload } from './lib/qrService'
import { AdminPanel } from './features/admin/AdminPanel'
import { PartnerPanel } from './features/partner/PartnerPanel'
import { ScanPanel } from './features/scan/ScanPanel'
import { LoginPage } from './features/auth/LoginPage'
import { ChangePasswordModal } from './features/auth/ChangePasswordModal'
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
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    if (!session && !scanMode) {
      setRecords([])
      setLoading(false)
      return
    }

    const partnerId = session?.role === 'partner' ? session.id : undefined

    setLoading(true)
    fetchRecords(partnerId)
      .then(setRecords)
      .catch(() => setError('無法載入資料，請確認 Supabase 連線設定。'))
      .finally(() => setLoading(false))
  }, [session, scanMode])

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
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#3b2a21', fontWeight: 800 }}>飯店合作夥伴管理系統</h1>
        <div className="user-status" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="user-info" style={{ color: '#3b2a21', fontWeight: 700 }}>
            {session.name} ({session.role === 'admin' ? '管理員' : '合作夥伴'})
          </span>
          <button className="logout-btn" onClick={() => setShowChangePassword(true)} style={{ background: 'transparent', color: '#d45c2f', border: '1px solid #d45c2f', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            修改密碼
          </button>
          <button className="logout-btn" onClick={handleLogout} style={{ background: '#d45c2f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            登出
          </button>
        </div>
      </nav>

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

      {showChangePassword && (
        <ChangePasswordModal
          session={session}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  )
}

export default App
