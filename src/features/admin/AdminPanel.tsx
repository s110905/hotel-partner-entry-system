import { Fragment, useState } from 'react'
import type { QrLifecycleStatus, PartnerSummary, QrRecord } from '../../types/qr'
import { computeStatus } from '../../utils/status'
import './AdminPanel.css'

type Props = {
  partnerSummaries: PartnerSummary[]
  records: QrRecord[]
  onToggleDisable: (id: string, disabled: boolean) => Promise<void>
}

type Tab = 'partners' | 'qr-detail'

const STATUS_LABEL: Record<QrLifecycleStatus, string> = {
  active: '可使用',
  partial_used: '部分已使用',
  used_up: '已用完',
  expired: '已過期',
  disabled: '已停用',
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部狀態' },
  { value: 'active', label: '可使用' },
  { value: 'partial_used', label: '部分已使用' },
  { value: 'used_up', label: '已用完' },
  { value: 'expired', label: '已過期' },
  { value: 'disabled', label: '已停用' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export function AdminPanel({ partnerSummaries, records, onToggleDisable }: Props) {
  const [tab, setTab] = useState<Tab>('partners')
  const [filterPartner, setFilterPartner] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [actionMessage, setActionMessage] = useState('')

  // ── Summary totals ─────────────────────────────────────
  const totals = partnerSummaries.reduce(
    (acc, s) => ({
      qrCount: acc.qrCount + s.qrCount,
      downloadCount: acc.downloadCount + s.downloadCount,
      totalQuota: acc.totalQuota + s.totalQuota,
      usedQuota: acc.usedQuota + s.usedQuota,
      remainingQuota: acc.remainingQuota + s.remainingQuota,
      expiredUnusedQuota: acc.expiredUnusedQuota + s.expiredUnusedQuota,
    }),
    { qrCount: 0, downloadCount: 0, totalQuota: 0, usedQuota: 0, remainingQuota: 0, expiredUnusedQuota: 0 },
  )

  const statCards = [
    { label: '合作夥伴數',   value: partnerSummaries.length, unit: '家', type: 'default' },
    { label: 'QR 建立數',   value: totals.qrCount,           unit: '張', type: 'default' },
    { label: '下載次數',     value: totals.downloadCount,     unit: '次', type: 'default' },
    { label: '總可用名額',   value: totals.totalQuota,        unit: '人', type: 'default' },
    { label: '已核銷人數',   value: totals.usedQuota,         unit: '人', type: 'success' },
    { label: '剩餘名額',     value: totals.remainingQuota,    unit: '人', type: 'info' },
    { label: '過期未使用',   value: totals.expiredUnusedQuota, unit: '人', type: 'danger' },
  ]

  // ── QR list (with live status) ─────────────────────────
  const partnerNames = Array.from(new Set(records.map(r => r.partnerName))).sort()

  const filteredRecords = records.filter(r => {
    if (filterPartner && r.partnerName !== filterPartner) return false
    if (filterStatus && computeStatus(r) !== filterStatus) return false
    return true
  })

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function toggleDisabled(record: QrRecord) {
    const nextDisabled = !record.disabled
    const msg = nextDisabled
      ? '確定要停用這張 QR 嗎？停用後客人將無法使用。'
      : '確定要恢復這張 QR 嗎？'
    
    if (!window.confirm(msg)) return

    try {
      await onToggleDisable(record.id, nextDisabled)
      const successMsg = nextDisabled
        ? `已停用 ${record.partnerName} 的 QR。`
        : `已恢復 ${record.partnerName} 的 QR。`
      setActionMessage(successMsg)
      setTimeout(() => setActionMessage(''), 3000)
    } catch (err) {
      setActionMessage('操作失敗，請稍後再試。')
      setTimeout(() => setActionMessage(''), 3000)
    }
  }

  // deleteRecord removed as it is not supported in the current service layer

  // ── Render ─────────────────────────────────────────────
  return (
    <section className="panel admin-panel">

      {/* Summary cards */}
      <div>
        <div className="panel-heading">
          <h2>管理後台</h2>
          <p>憑證統計與現場核銷紀錄查詢</p>
        </div>
        {actionMessage ? (
          <div className="admin-action-message">{actionMessage}</div>
        ) : null}
        <div className="admin-summary-grid">
          {statCards.map(c => (
            <div className={`admin-stat-card admin-stat-${c.type}`} key={c.label}>
              <div className="admin-stat-label">{c.label}</div>
              <div className="admin-stat-value">{c.value}</div>
              <div className="admin-stat-unit">{c.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'partners' ? 'active' : ''}`}
          onClick={() => setTab('partners')}
        >
          合作夥伴統計
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${tab === 'qr-detail' ? 'active' : ''}`}
          onClick={() => setTab('qr-detail')}
        >
          QR 明細
        </button>
      </div>

      {/* ── Tab: Partner Stats ─────────────────────────── */}
      {tab === 'partners' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>發行對象</th>
                <th>建立數</th>
                <th>下載數</th>
                <th>總量</th>
                <th>已用</th>
                <th>剩餘</th>
                <th>過期未使用</th>
              </tr>
            </thead>
            <tbody>
              {partnerSummaries.map(s => (
                <tr key={s.partnerName}>
                  <td><strong>{s.partnerName}</strong></td>
                  <td>{s.qrCount}</td>
                  <td>{s.downloadCount}</td>
                  <td>{s.totalQuota}</td>
                  <td>{s.usedQuota}</td>
                  <td>{s.remainingQuota}</td>
                  <td style={{ color: s.expiredUnusedQuota > 0 ? '#dc2626' : undefined }}>
                    {s.expiredUnusedQuota}
                  </td>
                </tr>
              ))}
              {partnerSummaries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#9a7b6a', padding: '24px' }}>
                    尚無合作夥伴資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: QR Detail ────────────────────────────── */}
      {tab === 'qr-detail' && (
        <>
          <div className="admin-filter-bar">
            <select
              className="admin-filter-select"
              value={filterPartner}
              onChange={e => setFilterPartner(e.target.value)}
            >
              <option value="">全部對象</option>
              {partnerNames.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <select
              className="admin-filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>代碼</th>
                  <th>發行對象</th>
                  <th>狀態</th>
                  <th>總量</th>
                  <th>已用</th>
                  <th>剩餘</th>
                  <th>到期日</th>
                  <th>下載數</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => {
                  const s = computeStatus(r)
                  const isOpen = expanded.has(r.id)
                  return (
                    <Fragment key={r.id}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="admin-expand-btn"
                            onClick={() => toggleExpand(r.id)}
                            title={isOpen ? '收起紀錄' : '展開核銷紀錄'}
                          >
                            {isOpen ? '▲' : '▼'}
                          </button>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem', color: '#475569' }}>{r.code}</code>
                        </td>
                        <td>{r.partnerName}</td>
                        <td>
                          <span className={`admin-badge admin-status-${s}`}>
                            {STATUS_LABEL[s]}
                          </span>
                        </td>
                        <td>{r.totalQuota}</td>
                        <td>{r.usedQuota}</td>
                        <td style={{ fontWeight: r.remainingQuota === 0 ? undefined : 700 }}>
                          {r.remainingQuota}
                        </td>
                        <td>{fmtDate(r.expiresAt)}</td>
                        <td>{r.downloadCount}</td>
                        <td>
                          <div className="admin-action-group">
                            <button
                              type="button"
                              className="admin-action-btn"
                              onClick={() => toggleDisabled(r)}
                            >
                              {r.disabled ? '恢復' : '停用'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="admin-sub-row">
                          <td colSpan={10}>
                            <div className="admin-sub-inner">
                              <p className="admin-sub-title">核銷紀錄</p>
                              {r.redemptions.length === 0 ? (
                                <p className="admin-no-redeem">尚無核銷紀錄</p>
                              ) : (
                                <table className="admin-sub-table">
                                  <thead>
                                    <tr>
                                      <th>核銷時間</th>
                                      <th>使用人數</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.redemptions.map(rd => (
                                      <tr key={rd.id}>
                                        <td>{fmtFull(rd.redeemedAt)}</td>
                                        <td>{rd.redeemedQuota} 人</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#9a7b6a', padding: '24px' }}>
                      無符合條件的 QR 資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </section>
  )
}
