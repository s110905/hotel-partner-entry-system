import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Plus, User, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import './CreateQRForm.css'

type CreateQRFormProps = {
  onAdd: (partnerName: string, totalQuota: number) => Promise<void>
}

const DEFAULT_PARTNER_NAME_KEY = 'hotel-partner-entry-default-partner-name'

function loadDefaultPartnerName() {
  return window.localStorage.getItem(DEFAULT_PARTNER_NAME_KEY) ?? ''
}

export function CreateQRForm({ onAdd }: CreateQRFormProps) {
  const [partnerName, setPartnerName] = useState(() => loadDefaultPartnerName())
  const [defaultPartnerName, setDefaultPartnerName] = useState(() => loadDefaultPartnerName())
  const [quota, setQuota] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!defaultPartnerName) {
      window.localStorage.removeItem(DEFAULT_PARTNER_NAME_KEY)
      return
    }

    window.localStorage.setItem(DEFAULT_PARTNER_NAME_KEY, defaultPartnerName)
  }, [defaultPartnerName])

  const handleSetDefaultPartner = () => {
    const nextPartnerName = partnerName.trim()

    if (!nextPartnerName) {
      setError('請先輸入合作夥伴名稱後，再設定預設值。')
      return
    }

    setError('')
    setDefaultPartnerName(nextPartnerName)
    setPartnerName(nextPartnerName)
  }

  const handleClearDefaultPartner = () => {
    setDefaultPartnerName('')
    setPartnerName('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSuccess || isSubmitting) return

    setError('')

    if (!partnerName.trim()) {
      setError('請輸入合作夥伴名稱。')
      return
    }

    if (quota < 1 || quota > 100) {
      setError('可用名額請設定在 1 到 100 之間。')
      return
    }

    setIsSubmitting(true)

    try {
      await onAdd(partnerName.trim(), quota)
      setIsSubmitting(false)
      setIsSuccess(true)

      window.setTimeout(() => {
        setIsSuccess(false)
        setPartnerName(defaultPartnerName)
        setQuota(1)
      }, 1800)
    } catch (err) {
      setIsSubmitting(false)
      setError('建立失敗，請稍後再試。')
    }
  }

  return (
    <motion.div layout className="glass-card create-form-card">
      <div className="create-form-header">
        <div className="create-form-icon">
          <Plus size={20} />
        </div>
        <div>
          <h3>建立新憑證</h3>
          <p>輸入合作飯店名稱與可用人數，系統將自動建立 1 個月有效的 QR 憑證。</p>
        </div>
      </div>

      <div className="create-form-body">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="create-form-success"
            >
              <div className="create-form-success-icon">
                <CheckCircle2 size={42} />
              </div>
              <h4>憑證建立成功</h4>
              <p>新的 QR 憑證已加入清單，您可以立即下載並提供給合作夥伴。</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="create-form-fields"
            >
              <label className="create-form-field">
                <span className="create-form-label">
                  <User size={14} />
                  合作夥伴名稱
                </span>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(event) => setPartnerName(event.target.value)}
                  placeholder="例如：日光飯店"
                  disabled={isSubmitting}
                />
                <div className="create-form-default-row">
                  {defaultPartnerName ? (
                    <span className="create-form-default-chip">預設：{defaultPartnerName}</span>
                  ) : (
                    <span className="create-form-default-hint">尚未設定預設飯店名稱</span>
                  )}
                  <div className="create-form-default-actions">
                    <button
                      type="button"
                      className="create-form-link-btn"
                      onClick={handleSetDefaultPartner}
                      disabled={isSubmitting}
                    >
                      設為預設
                    </button>
                    {defaultPartnerName ? (
                      <button
                        type="button"
                        className="create-form-link-btn danger"
                        onClick={handleClearDefaultPartner}
                        disabled={isSubmitting}
                      >
                        清除預設
                      </button>
                    ) : null}
                  </div>
                </div>
              </label>

              <label className="create-form-field">
                <span className="create-form-label">
                  <Users size={14} />
                  可用人數
                </span>
                <div className="create-form-quota-row">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={Math.min(quota, 20)}
                    onChange={(event) => setQuota(Number.parseInt(event.target.value, 10))}
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quota}
                    onChange={(event) => setQuota(Number.parseInt(event.target.value, 10) || 1)}
                    disabled={isSubmitting}
                    className="create-form-number"
                  />
                </div>
                <small>若要超過 20 人，可直接在右側輸入數字。</small>
              </label>

              <AnimatePresence>
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="create-form-error"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button type="submit" disabled={isSubmitting} className="btn-primary create-form-submit">
                {isSubmitting ? '建立中...' : '建立 QR 憑證'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
