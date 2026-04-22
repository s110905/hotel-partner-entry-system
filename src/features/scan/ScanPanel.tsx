import { useState } from 'react'
import { Camera } from 'lucide-react'
import type { QrLifecycleStatus, QrRecord } from '../../types/qr'
import { canRedeem, computeStatus } from '../../utils/status'
import { CameraScanner } from './components/CameraScanner'
import './ScanPanel.css'

type Props = {
  records: QrRecord[]
  onRedeem: (id: string, amount: number) => Promise<void>
  isUnlocked: boolean
  onUnlock: () => void
}

type Step = 'idle' | 'scanning' | 'found' | 'done'

type Outcome = { ok: true } | { ok: false; reason: string }

const STATUS_LABEL: Record<QrLifecycleStatus, string> = {
  active: '可使用',
  partial_used: '部分已使用',
  used_up: '已用完',
  expired: '已過期',
  disabled: '已停用',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ScanPanel({ records, onRedeem, isUnlocked, onUnlock }: Props) {
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<QrRecord | null>(null)
  const [amount, setAmount] = useState(1)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [entryMode, setEntryMode] = useState<'camera' | 'manual'>('manual')
  const [scanError, setScanError] = useState<string | null>(null)

  // ── Helpers ────────────────────────────────────────────

  function selectRecord(record: QrRecord, mode: 'camera' | 'manual' = 'manual') {
    setSelected(record)
    setAmount(1)
    setOutcome(null)
    setEntryMode(mode)
    setStep('found')
  }

  // Camera detected raw string — may be JSON payload from buildQrPayload
  function handleDetect(raw: string) {
    let code = raw.trim()
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (typeof parsed.code === 'string') code = parsed.code
    } catch { /* not JSON — treat as raw code string */ }

    const record = records.find(r => r.code === code)
    if (record) {
      selectRecord(record, 'camera')
    } else {
      setScanError('找不到此 QR，請確認是否為有效憑證')
      setStep('idle')
      setTimeout(() => setScanError(null), 3000)
    }
  }

  function handleAmountChange(v: number) {
    const max = selected?.remainingQuota ?? 1
    const val = isNaN(v) ? 1 : Math.min(max, Math.max(1, v))
    setAmount(val)
  }

  async function handleRedeem() {
    if (!selected) return
    const check = canRedeem(selected, amount)
    if (!check.ok) {
      setOutcome({ ok: false, reason: check.reason })
      setStep('done')
      return
    }

    try {
      await onRedeem(selected.id, amount)

      // Optimistically update local selected state for display in "done" step
      const updated: QrRecord = {
        ...selected,
        usedQuota: selected.usedQuota + amount,
        remainingQuota: selected.remainingQuota - amount,
        redemptions: [
          ...selected.redemptions,
          { id: crypto.randomUUID(), redeemedQuota: amount, redeemedAt: new Date().toISOString() },
        ],
      }

      setSelected(updated)
      setOutcome({ ok: true })
      setStep('done')
    } catch (err) {
      setOutcome({ ok: false, reason: '核銷失敗，請確認網路連線或稍後再試。' })
      setStep('done')
    }
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin === '1234') {
      onUnlock()
      setPin('')
      setPinError('')
    } else {
      setPinError('PIN 碼錯誤')
    }
  }

  function reset() {
    setStep('idle')
    setSelected(null)
    setSearch('')
    setAmount(1)
    setOutcome(null)
  }

  // ── Derived ────────────────────────────────────────────

  const filtered = records.filter(r =>
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.partnerName.includes(search),
  )

  const status = selected ? computeStatus(selected) : null
  const canDoRedeem = status === 'active' || status === 'partial_used'
  const maxAmount = selected?.remainingQuota ?? 1

  // ── Render ─────────────────────────────────────────────

  if (!isUnlocked) {
    return (
      <section className="panel scan-panel">
        <div className="panel-heading">
          <h2>現場核銷驗證</h2>
          <p>請輸入核銷 PIN 碼以繼續</p>
        </div>
        <form onSubmit={handlePinSubmit} style={{ display: 'grid', gap: 16, maxWidth: 320, margin: '20px auto' }}>
          <input
            type="password"
            className="scan-search-input"
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="••••"
            maxLength={4}
            autoFocus
          />
          {pinError && <p style={{ color: '#dc2626', textAlign: 'center', fontWeight: 600 }}>{pinError}</p>}
          <button type="submit" className="scan-btn-confirm">驗證並進入</button>
        </form>
      </section>
    )
  }

  return (
    <section className="panel scan-panel">

      {/* ── Idle: pick or scan ─────────────────────────── */}
      {step === 'idle' && (
        <>
          <div className="panel-heading">
            <h2>掃碼核銷</h2>
            <p>選取既有 QR，或開啟相機掃描客人的 QR 碼</p>
          </div>

          <div className="scan-search-row">
            <input
              className="scan-search-input"
              type="text"
              placeholder="搜尋代碼或合作夥伴…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
            <button type="button" className="scan-btn-camera" onClick={() => setStep('scanning')}>
              <Camera size={18} /> 相機掃描
            </button>
          </div>

          {scanError && (
            <div className="scan-block-msg" style={{ marginTop: 12 }}>
              {scanError}
            </div>
          )}

          {records.length === 0 ? (
            <div className="scan-block-msg" style={{ textAlign: 'center', background: '#fff3eb', color: '#8a3f18', borderColor: 'transparent', padding: '24px' }}>
              目前系統尚無憑證資料，請先至「發放憑證」頁面建立憑證後再進行核銷。
            </div>
          ) : filtered.length === 0 ? (
            <div className="scan-empty">找不到符合的憑證</div>
          ) : (
            <ul className="scan-qr-list">
              {filtered.map(r => {
                const s = computeStatus(r)
                return (
                  <li key={r.id}>
                    <button type="button" className="scan-qr-item-btn" onClick={() => selectRecord(r)}>
                      <span className="scan-qr-item-partner">{r.partnerName}</span>
                      <span className="scan-qr-item-code">{r.code}</span>
                      <span className={`scan-status-badge scan-status-${s}`}>{STATUS_LABEL[s]}</span>
                      <span className="scan-qr-item-quota">{r.remainingQuota}/{r.totalQuota}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {/* ── Camera scanning ────────────────────────────── */}
      {step === 'scanning' && (
        <>
          <div className="panel-heading">
            <h2>掃描憑證</h2>
            <p>請將旅客的 QR Code 對準畫面中央</p>
          </div>
          <CameraScanner onDetect={handleDetect} onClose={() => setStep('idle')} />
        </>
      )}

      {/* ── Found: info + redeem ───────────────────────── */}
      {step === 'found' && selected && status && (
        <>
          <div className="panel-heading">
            <h2>核銷確認</h2>
          </div>

          <div className="scan-info-card">
            <div className="scan-info-row">
              <span className="scan-info-label">合作夥伴</span>
              <span className="scan-info-value">{selected.partnerName}</span>
            </div>
            <div className="scan-info-row">
              <span className="scan-info-label">QR 代碼</span>
              <code className="scan-info-code">{selected.code}</code>
            </div>
            <div className="scan-info-row">
              <span className="scan-info-label">狀態</span>
              <span className={`scan-status-badge scan-status-${status}`}>{STATUS_LABEL[status]}</span>
            </div>
            <div className="scan-info-row">
              <span className="scan-info-label">到期時間</span>
              <span className="scan-info-value">{fmtDate(selected.expiresAt)}</span>
            </div>
            <div className="scan-quota-grid">
              <div className="scan-quota-cell">
                <div className="scan-quota-label">總名額</div>
                <div className="scan-quota-value">{selected.totalQuota}</div>
              </div>
              <div className="scan-quota-cell">
                <div className="scan-quota-label">已使用</div>
                <div className="scan-quota-value">{selected.usedQuota}</div>
              </div>
              <div className="scan-quota-cell">
                <div className="scan-quota-label">剩餘</div>
                <div className={`scan-quota-value ${selected.remainingQuota === 0 ? 'scan-quota-zero' : ''}`}>
                  {selected.remainingQuota}
                </div>
              </div>
            </div>
          </div>

          {canDoRedeem ? (
            <div className="scan-redeem-form">
              <span className="scan-redeem-label">本次入園人數（最多 {maxAmount} 人）</span>
              <div className="scan-stepper">
                <button
                  type="button"
                  className="scan-stepper-btn"
                  onClick={() => handleAmountChange(amount - 1)}
                  disabled={amount <= 1}
                >−</button>
                <input
                  type="number"
                  className="scan-stepper-input"
                  value={amount}
                  min={1}
                  max={maxAmount}
                  onChange={e => handleAmountChange(parseInt(e.target.value, 10))}
                />
                <button
                  type="button"
                  className="scan-stepper-btn"
                  onClick={() => handleAmountChange(amount + 1)}
                  disabled={amount >= maxAmount}
                >+</button>
              </div>
              <button type="button" className="scan-btn-confirm" onClick={handleRedeem}>
                確認核銷 {amount} 人
              </button>
            </div>
          ) : (
            <div className="scan-block-msg">
              <strong>無法核銷：</strong> 此憑證狀態為「{STATUS_LABEL[status]}」
            </div>
          )}

          <button
            type="button"
            className="scan-btn-back"
            onClick={() => entryMode === 'camera' ? setStep('scanning') : reset()}
          >
            返回上一頁
          </button>
        </>
      )}

      {/* ── Done: result ───────────────────────────────── */}
      {step === 'done' && outcome && selected && (
        <div className="scan-result">
          {outcome.ok ? (
            <>
              <div className="scan-result-icon scan-result-success" aria-hidden="true">✓</div>
              <h2 className="scan-result-title">核銷成功！</h2>
              <p className="scan-result-desc">
                本次已核銷 <strong>{amount}</strong> 人<br />
                剩餘可用名額：<strong>{selected.remainingQuota}</strong> 人
              </p>
                <div className="scan-quota-grid" style={{ maxWidth: 320, margin: '16px auto 0' }}>
                  <div className="scan-quota-cell">
                    <div className="scan-quota-label">總名額</div>
                    <div className="scan-quota-value">{selected.totalQuota}</div>
                  </div>
                  <div className="scan-quota-cell">
                    <div className="scan-quota-label">已使用</div>
                    <div className="scan-quota-value">{selected.usedQuota}</div>
                  </div>
                  <div className="scan-quota-cell">
                    <div className="scan-quota-label">剩餘</div>
                    <div className={`scan-quota-value ${selected.remainingQuota === 0 ? 'scan-quota-zero' : ''}`}>
                      {selected.remainingQuota}
                    </div>
                  </div>
                </div>
                {selected.remainingQuota === 0 && (
                  <div className="scan-zero-quota-warning">
                    憑證已全數使用完畢
                  </div>
                )}
            </>
          ) : (
            <>
              <div className="scan-result-icon scan-result-error" aria-hidden="true">✕</div>
              <h2 className="scan-result-title">核銷失敗</h2>
              <p className="scan-result-err-msg">{outcome.reason}</p>
            </>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {!outcome.ok && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setStep('found')
                  setOutcome(null)
                }}
              >
                重試核銷
              </button>
            )}
            <button type="button" className="scan-btn-confirm" onClick={() => entryMode === 'camera' ? setStep('scanning') : reset()}>
              {outcome.ok ? '繼續核銷下一筆' : '放棄並返回'}
            </button>
          </div>
        </div>
      )}

    </section>
  )
}
