import { useState } from 'react'
import type { AuthRole, AuthSession } from '../../lib/authService'
import { loginAdmin, loginPartner } from '../../lib/authService'
import './LoginPage.css'

type Props = {
  onLogin: (session: AuthSession) => void
  defaultRole?: AuthRole
  contextLabel?: string
}

export function LoginPage({ onLogin, defaultRole = 'partner', contextLabel }: Props) {
  const [role, setRole] = useState<AuthRole>(defaultRole)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = role === 'partner'
        ? await loginPartner(account, password)
        : await loginAdmin(account, password)
      onLogin(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗')
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
        </form>
      </div>
    </div>
  )
}
