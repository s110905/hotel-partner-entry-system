import { useState } from 'react'
import type { AuthRole, AuthSession } from '../../lib/authService'
import { loginAdmin, loginPartner } from '../../lib/authService'

type Props = {
  onLogin: (session: AuthSession) => void
  defaultRole?: AuthRole
}

export function LoginPage({ onLogin, defaultRole = 'partner' }: Props) {
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>飯店入場管理系統</h1>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.9rem' }}>請選擇角色並登入</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['partner', 'admin'] as AuthRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: role === r ? '#6366f1' : '#e2e8f0',
                background: role === r ? '#eef2ff' : '#fff',
                color: role === r ? '#6366f1' : '#64748b',
                cursor: 'pointer',
                fontWeight: role === r ? 600 : 400,
              }}
            >
              {r === 'partner' ? '合作飯店' : '管理後台'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', color: '#374151' }}>帳號</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', color: '#374151' }}>密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  )
}
