import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './ChangePasswordModal.css'

type Props = {
  session: { id: string; role: 'partner' | 'admin'; name: string; account: string }
  onClose: () => void
}

export function ChangePasswordModal({ session, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('新密碼至少需要 6 個字元')
      return
    }

    setLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('change-password', {
        body: {
          id: session.id,
          role: session.role,
          currentPassword,
          newPassword,
        },
      })

      if (invokeError) throw invokeError
      if (data.error) throw new Error(data.error)

      setSuccess('密碼已更新')
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">修改密碼</h2>
        <p className="modal-subtitle">正在為帳號 {session.account} 修改密碼</p>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">目前密碼</label>
            <input
              type="password"
              className="modal-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">新密碼 (至少 6 字元)</label>
            <input
              type="password"
              className="modal-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">確認新密碼</label>
            <input
              type="password"
              className="modal-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="modal-error">{error}</p>}
          {success && <p className="modal-success">{success}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '更新中...' : '確認修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
