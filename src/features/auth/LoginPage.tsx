import { useState } from 'react'
import type { AuthRole, AuthSession } from '../../lib/authService'
import { loginAdmin, loginPartner } from '../../lib/authService'
import './LoginPage.css'

type Props = {
  onLogin: (session: AuthSession) => void
  onScanMode: () => void
  defaultRole?: AuthRole
  contextLabel?: string
}

export function LoginPage({ onLogin, onScanMode, defaultRole = 'partner', contextLabel }: Props) {
  const [role, setRole] = useState<AuthRole>(defaultRole)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [lockUntil, setLockUntil] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    if (lockUntil && Date.now() < lockUntil) {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000)
      setError(`登入嘗試次數過多，請等待 ${remaining} 秒後再試`)
      return
    }

    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = role === 'partner'
        ? await loginPartner(account, password)
        : await loginAdmin(account, password)
      setFailCount(0)
      onLogin(session)
    } catch (err) {
      const newCount = failCount + 1
      setFailCount(newCount)
      if (newCount >= 5) {
        setLockUntil(Date.now() + 15 * 60 * 1000) // 鎖定 15 分鐘
        setFailCount(0)
        setError('登入嘗試次數過多，請等待 15 分鐘後再試')
      } else {
        setError(err instanceof Error ? err.message : '登入失敗')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrap">
      <div className="login-card">
        <h1 className="login-title">飯店入場管理系統</h1>
        <p className="login-subtitle">
          {contextLabel ? `您正在登入：${contextLabel}` : '請選擇角色並登入'}
        </p>

        <div className="login-role-selector">
          {(['partner', 'admin'] as AuthRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError('') }}
              className={`login-role-btn ${role === r ? 'active' : ''}`}
            >
              {r === 'partner' ? '合作飯店' : '管理後台'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
          <div className="login-field">
            <label className="login-label">帳號</label>
            <input
              type="text"
              className="login-input"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label">密碼</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? '登入中...' : '登入系統'}
          </button>

          <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20, textAlign: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', background: 'transparent', border: '2px solid #d45c2f', color: '#d45c2f' }}
              onClick={onScanMode}
            >
              進入現場核銷入口
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
